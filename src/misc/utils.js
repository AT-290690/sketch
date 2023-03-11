import { compileToJs } from '../core/compiler.js'
import { parse } from '../core/parser.js'
import { runFromAST } from '../core/interpreter.js'
import { tokens } from '../core/tokeniser.js'
import { STD, protolessModule } from '../extensions/extentions.js'
import { removeNoCode, wrapInBody } from './helpers.js'
import Inventory from '../extensions/Inventory.js'

const findParent = (ast) => {
  let out = { fn: null, res: null }
  for (const prop in ast)
    if (Array.isArray(ast[prop]))
      for (const arg of ast[prop]) {
        if (arg.type === 'apply') out.fn = arg.operator.name
        const temp = findParent(arg)
        if (temp.res !== undefined) out.res = temp.res
      }
    else if (ast[prop] !== undefined) out.res = ast[prop]
  return out
}

export const runFromInterpreted = (source, extensions) =>
  exe(
    handleUnbalancedParens(removeNoCode(source.toString().trim())),
    STD,
    extensions
  )
export const runFromCompiled = (source) => eval(compileModule(source))

export const exe = (source, std = {}, extensions = {}) => {
  for (const ext in extensions) std[ext] = extensions[ext]
  const ENV = protolessModule(std)
  ENV[';;runes'] = protolessModule(tokens)
  const AST = parse(wrapInBody(source))
  return runFromAST(AST, ENV).result
}
export const isBalancedParenthesis = (sourceCode) => {
  let count = 0
  const stack = []
  const str = sourceCode.replace(/"(.*?)"/g, '')
  const pairs = { ']': '[' }
  for (let i = 0; i < str.length; ++i)
    if (str[i] === '[') stack.push(str[i])
    else if (str[i] in pairs) if (stack.pop() !== pairs[str[i]]) ++count
  return { str, diff: count - stack.length }
}
export const handleUnbalancedParens = (sourceCode) => {
  const parenMatcher = isBalancedParenthesis(sourceCode)
  if (parenMatcher.diff !== 0)
    throw new SyntaxError(
      `Parenthesis are unbalanced by ${parenMatcher.diff > 0 ? '+' : ''}${
        parenMatcher.diff
      } "]"`
    )
  return sourceCode
}

export const treeShake = (modules) => {
  let lib = ''
  const dfs = (modules, lib, LIBRARY) => {
    for (const key in modules) {
      if (key !== 'LIBRARY' && modules[key] !== undefined) {
        lib += '["' + key + '"]:{'
        for (const method of modules[key]) {
          if (LIBRARY[key]) {
            const current = LIBRARY[key][method]
            if (current) {
              if (typeof current === 'object') {
                lib += dfs({ [method]: modules[method] }, '', LIBRARY[key])
              } else {
                lib += '["' + method + '"]:'
                lib += current.toString()
                lib += ','
              }
            }
          }
        }
        lib += '},'
      }
    }
    return lib
  }
  lib += 'const LIBRARY = {' + dfs(modules, lib, STD.LIBRARY) + '}'
  return lib
}
export const compilePlain = (source) => {
  const inlined = wrapInBody(removeNoCode(source))
  const { top, program, modules } = compileToJs(parse(inlined))
  const lib = treeShake(modules)
  return `${lib};
${top}
${program}`
}
export const compileModule = (source) => {
  const inlined = wrapInBody(removeNoCode(source))
  const { top, program, modules } = compileToJs(parse(inlined))
  const lib = treeShake(modules)
  return `const VOID = 0;
${Inventory.toString()}
${lib};
${top}${program}`
}
export const compilePlainJs = (source) => {
  const inlined = wrapInBody(removeNoCode(source))
  const { top, program } = compileToJs(parse(inlined))
  return `const VOID = 0;
${top}${program}`
}

export const compileHtml = (
  source,
  scripts = `<script
  src="./src/misc/svg.min.js"
  ></script><script
  src="./src/misc/rough.min.js"
  ></script>`
) => {
  const inlined = wrapInBody(removeNoCode(source))
  const { top, program, modules } = compileToJs(parse(inlined))
  const lib = treeShake(modules)
  return `
<style>body { background: #0e0e0e } </style><body>
${scripts}
<script>
${Inventory.toString()}
const VOID = 0;
</script>
<script>${lib}</script>
<script> (() => { ${top}${program} })()</script>
</body>`
}
export const compileHtmlModule = (
  source,
  scripts = `<script
  src="./src/misc/svg.min.js"
  ></script><script
  src="./src/misc/rough.min.js"
  ></script>`
) => {
  const inlined = wrapInBody(removeNoCode(source))
  const { top, program, modules } = compileToJs(parse(inlined))
  const lib = treeShake(modules)
  return `
<style>body { background: #0e0e0e } </style><body>
${scripts}
<script type="module">
  import Inventory from '../../chip/language/extensions/Inventory.js'; 
  const VOID = 0;
  ${lib};
  (() => { ${top}${program} })()
 </script>
</body>`
}

export const compileExecutable = (source, ctx) => {
  const inlined = wrapInBody(removeNoCode(source))
  const ENV = protolessModule(ctx)
  ENV[';;runes'] = protolessModule(tokens)
  delete ENV[';;runes']['<-']
  const AST = parse(inlined)
  // const { AST } = cell(ENV, false)(inlined)
  const { top, program, modules } = compileToJs(AST, ctx)
  const lib = treeShake(modules)
  return `const VOID = 0;
  ${Inventory.toString()}
  ${lib};
  ${top}${program}`
}
