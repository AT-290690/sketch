import { decodeBase64 } from './src/misc/compression.js'
import { compileToJs } from './src/core/compiler.js'
import { treeShake, runFromInterpreted } from './src/misc/utils.js'
import { wrapInBody } from './src/misc/helpers.js'
import { parse } from './src/core/parser.js'
import Inventory from './src/extensions/Inventory.js'

const buildModule = (encoding) => {
  const inlined = wrapInBody(encoding)
  const { top, program, modules } = compileToJs(parse(inlined))
  const lib = treeShake(modules)
  return { top, program, lib }
}
const buildScript = (encoding) => {
  const { top, program, lib } = buildModule(encoding)
  return `
${lib}
;(() => {
  ${top}
  ${program}
  })()`
}
window.runFromInterpreted = runFromInterpreted
window.decodeBase64 = decodeBase64
window.Inventory = Inventory
const std = document.createElement('script')
std.innerHTML = `const VOID = 0; const LOGGER = () => () => {}; `
document.body.appendChild(std)
const appendScript = (encoding) => {
  const script = document.createElement('script')
  if (encoding) script.innerHTML += `{ ${buildScript(encoding)} }`
  document.body.appendChild(script)
}
window.buildModule = (str) => {
  const { top, program, lib } = buildModule(str)
  return new Function(`
    ${lib}
    ${top}
    return ${program}
  `)()
}
appendScript(
  decodeBase64(
    decodeURIComponent(new URLSearchParams(location.search).get('l') ?? '')
  )
)
