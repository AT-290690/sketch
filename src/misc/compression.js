import { removeNoCode, wrapInBody } from './helpers.js'
import { parse } from '../core/parser.js'
import { LZUTF8 } from './lz-utf8.js'
import { tokens } from '../core/tokeniser.js'
import { LIBRARY } from '../extensions/extentions.js'
import { evaluate } from '../core/interpreter.js'
import Inventory from '../extensions/Inventory.js'
import { runFromInterpreted } from './utils.js'

const ABC = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
]

tokens['~*'] = (args, env) => {
  if (!args.length) throw new RangeError('Invalid number of arguments to ~* []')
  const callback = evaluate(args.pop(), env)
  if (typeof callback !== 'function')
    throw new TypeError('Second argument of ~* must be an -> []')
  Promise.all(
    args.map((arg) => fetch(evaluate(arg, env)).then((r) => r.text()))
  ).then((encodes) => {
    const signals = Inventory.from(
      encodes.map((encode) =>
        runFromInterpreted(decodeBase64(decodeURIComponent(encode.trim())))
      )
    )
    callback(signals)
  })
  return 0
}

const OFFSET = 161
const generateCompressionRunes = (start) => {
  return Object.keys(tokens)
    .map((t) => `${t}[`)
    .sort((a, b) => (a.length > b.length ? -1 : 1))
    .concat(['][', ']];', '];'])
    .map((t, i) => ({
      full: t,
      short: String.fromCharCode(start + i + OFFSET),
    }))
}
export const generateCompressedModules = (start) => {
  const { NAME, ...lib } = LIBRARY
  const modules = new Set([NAME])
  const dfs = (lib, modules) => {
    for (const module in lib) {
      if (module.length > 1) modules.add(module)
      for (const m in lib[module]) {
        if (lib[module][m].NAME) dfs(lib[module][m], modules)
        if (m !== 'NAME' && m.length > 1) modules.add(m)
      }
    }
  }
  dfs(lib, modules)
  return [...modules].map((full, i) => {
    const short = String.fromCharCode(start + i + OFFSET)
    return { full, short }
  })
}
export const shortRunes = generateCompressionRunes(0)
export const shortModules = generateCompressedModules(shortRunes.length)
const dfs = (
  tree,
  definitions = new Set(),
  imports = new Set()
  // excludes = new Set()
) => {
  for (const node of tree) {
    const { type, operator, args, name } = node
    if (type === 'import') imports.add(name)
    else if (
      type === 'word' &&
      node.name.length > 1 &&
      node.name[0] !== '_' &&
      !imports.has(node.name)
    )
      definitions.add(node.name)
    else if (type === 'apply' && operator.type === 'word')
      args.forEach(({ name }) => {
        if (name && name.length > 2 && name[0] !== '_') {
          definitions.add(name)
        }
      })
    if (Array.isArray(args)) dfs(args, definitions, imports)
    if (Array.isArray(operator?.args)) dfs(operator.args, definitions, imports)
  }
  return { definitions, imports }
}
export const compress = (source) => {
  const raw = removeNoCode(source).split('];]').join(']]')
  const strings = raw.match(/"([^"]*)"/g) || []
  const value = raw.replaceAll(/"([^"]*)"/g, '" "')
  const AST = parse(wrapInBody(value))
  const { definitions, imports } = dfs(
    AST.args,
    new Set(),
    new Set(['LIBRARY'])
  )
  // imports.forEach(value => {
  //   if (definitions.has(value)) definitions.delete(value)
  // })

  const importedModules = shortModules.reduce((acc, item) => {
    if (imports.has(item.full)) acc.push(item)
    return acc
  }, [])

  const defs = [...definitions]
  let { result, occurance } = value.split('').reduce(
    (acc, item) => {
      if (item === ']') acc.occurance++
      else {
        if (acc.occurance < 3) {
          acc.result += ']'.repeat(acc.occurance)
          acc.occurance = 0
        } else {
          acc.result += "'" + acc.occurance
          acc.occurance = 0
        }
        acc.result += item
      }
      return acc
    },
    { result: '', occurance: 0 }
  )
  if (occurance > 0) result += "'" + occurance

  for (const { full, short } of importedModules)
    result = result.replaceAll(new RegExp(`\\b${full}\\b`, 'g'), short)

  let index = 0
  let count = 0
  const shortDefinitions = defs.map((full) => {
    const short = ABC[index] + count
    ++index
    if (index === ABC.length) {
      index = 0
      ++count
    }
    return { full, short }
  })
  for (const { full, short } of shortDefinitions)
    result = result.replaceAll(new RegExp(`\\b${full}\\b`, 'g'), short)

  for (const { full, short } of shortRunes)
    result = result.replaceAll(full, short)

  result = result.split('" "')
  strings.forEach((str, i) => (result[i] += str))

  return result.join('')
}
export const decompress = (raw) => {
  const strings = raw.match(/"([^"]*)"/g) || []
  const value = raw.replaceAll(/"([^"]*)"/g, '" "')
  const suffix = [...new Set(value.match(/\'+?\d+/g))]
  let result = suffix.reduce(
    (acc, m) => acc.split(m).join(']'.repeat(parseInt(m.substring(1)))),
    value
  )
  for (const { full, short } of shortModules)
    result = result.replaceAll(new RegExp(short, 'g'), full)

  for (const { full, short } of shortRunes)
    result = result.replaceAll(short, full)

  result = result.split('" "')
  strings.forEach((str, i) => (result[i] += str))

  return result.join('')
}
export const encodeBase64 = (source) =>
  LZUTF8.compress(compress(source).trim(), { outputEncoding: 'Base64' })

export const decodeBase64 = (source) =>
  decompress(
    LZUTF8.decompress(source.trim(), {
      inputEncoding: 'Base64',
      outputEncoding: 'String',
    })
  )
