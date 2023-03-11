import { CodeMirror } from './hlp.editor.bundle.js'
import { runFromInterpreted } from '../src/misc/utils.js'
import { encodeBase64 } from '../src/misc/compression.js'
import {
  extractComments,
  handleHangingSemi,
  removeNoCode,
} from '../src/misc/helpers.js'

const consoleElement = document.getElementById('console')
const editorContainer = document.getElementById('editor-container')
const droneButton = document.getElementById('drone')
const consoleEditor = CodeMirror(consoleElement)
const iframeContainer = document.getElementById('window')
const extensions = {
  LOGGER: (disable = 0) => {
    if (disable) return () => {}
    return (msg) => {
      const current = consoleEditor.getValue()
      consoleEditor.setValue(
        `${current ? `${current}; ` : ''}${
          msg !== undefined
            ? typeof msg === 'string'
              ? `"${msg}"`
              : typeof msg === 'function'
              ? '-> []'
              : JSON.stringify(
                  msg.constructor.name === 'Inventory'
                    ? msg.items
                    : msg.constructor.name === 'Map'
                    ? Object.fromEntries(msg)
                    : msg,
                  null
                )
                  .replaceAll('[', '.: [')
                  .replaceAll('{', ':: [')
                  .replaceAll('}', ']')
                  .replaceAll(',', '; ')
                  .replaceAll('":', '"; ')
                  .replaceAll('null', 'void')
                  .replaceAll('undefined', 'void')
            : 'void'
        }`
      )
      // popup.setCursor(
      //   popup.posToOffset({ ch: 0, line: popup.lineCount() - 1 }),
      //   true
      // )
      return msg
    }
  },
}

const execute = async (source) => {
  try {
    const result = runFromInterpreted(source, extensions)
    return result
  } catch (err) {
    consoleEditor.setValue(err + ' ')
  }
}

const editor = CodeMirror(editorContainer, {})
droneButton.addEventListener('click', () => {
  return document.dispatchEvent(
    new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 's',
    })
  )
})

const cmds = {
  validate: ';; validate',
  assert: ';; assert',
  app: ';; app',
  share: ';; share',
  sketch: ';; sketch',
  log: ';; log',
  exe: ';; exe',
}

const withCommand = (command = editor.getLine(0)) => {
  const value = editor.getValue()

  switch (command.trim()) {
    case cmds.validate:
      {
        let result = value
        extractComments(result)
          .filter((x) => x.split(`;; @check`)[1]?.trim())
          .filter(Boolean)
          .forEach((x) => {
            const def = handleHangingSemi(x.split(';; @check')[1])
            result = result.replaceAll(x, `!throw[${def}; "${def}"];`)
          })
        try {
          runFromInterpreted(result)
          extensions.LOGGER(0)('All checks passed!')
        } catch (err) {
          extensions.LOGGER(0)(err.message.trim())
        }
      }
      break
    case cmds.assert:
      {
        const mocks = extractComments(value)
          .map((x) => x.split(';; @mock')[1]?.trim())
          .filter(Boolean)
          .map((x) => handleHangingSemi(x) + ';')
          .join('\n')

        const res = extractComments(value)
          .map((x) => x.split(';; @test')[1]?.trim())
          .filter(Boolean)
          .map((x) =>
            runFromInterpreted(
              `${handleHangingSemi(removeNoCode(value))};${mocks}${x}`
            )
          )
        if (res.every((x) => !!x)) extensions.LOGGER(0)('All tests passed!')
        else
          extensions.LOGGER(0)(
            `Tests: ${res.map((x) => (x ? '+' : '-')).join(' ')}`
          )
      }
      break
    case cmds.app:
      {
        const encoded = encodeURIComponent(encodeBase64(value))
        window.open(
          `https://at-290690.github.io/sketch/?l=` + encoded,
          'Bit',
          `menubar=no,directories=no,toolbar=no,status=no,scrollbars=no,resize=no,width=600,height=600,left=600,top=150`
        )
      }
      break
    case cmds.share:
      {
        const link = `https://at-290690.github.io/sketch/?l=${encodeURIComponent(
          encodeBase64(value)
        )}`
        consoleEditor.setValue(link)
        consoleEditor.focus()
        consoleEditor.setSelection(0, link.length)
      }

      break
    case cmds.sketch:
      {
        const encoded = encodeURIComponent(encodeBase64(value))
        iframeContainer.src =
          `${window.location.href.split('/editor/')[0]}/index.html?l=` + encoded
      }
      break
    case cmds.log:
      {
        const selection = editor.getSelection().trim()
        if (selection) {
          const isEndingWithSemi = selection[selection.length - 1] === ';'
          const out = `__debug_log[${
            isEndingWithSemi
              ? selection.substring(0, selection.length - 1)
              : selection
          }; ""]${isEndingWithSemi ? ';' : ''}`
          editor.replaceSelection(out)

          execute(`:=[__debug_log; LOGGER[0]]; ${editor.getValue().trim()}`)
          editor.setValue(value)
        } else execute(`:=[__debug_log; LOGGER[0]]; __debug_log[:[${value}]]`)
      }
      break
    case cmds.exe:
    default:
      {
        execute(value)
        const encoded = encodeURIComponent(encodeBase64(value))
        iframeContainer.src =
          `${window.location.href.split('/editor/')[0]}/index.html?l=` + encoded
      }
      break
  }
}
const knownCmds = (cmd) => cmd.trim() in cmds
document.addEventListener('keydown', (e) => {
  if (e.key && e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
    e = e || window.event
    e.preventDefault()
    e.stopPropagation()
    consoleEditor.setValue('')
    const cmds = editor.getLine(0).split(';; ').filter(knownCmds)
    if (!cmds.length) cmds.push(';; exe')
    cmds.map((x) => `;; ${x.trim()}`).forEach((cmd) => withCommand(cmd))
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
  }
})
editor.focus()
window.addEventListener('resize', () => {
  const bouds = document.body.getBoundingClientRect()
  const width = bouds.width
  const height = bouds.height
  editor.setSize(width, height / 2 - 60)
  consoleEditor.setSize(width - 80, 40)
})
const bounds = document.body.getBoundingClientRect()
editor.setSize(bounds.width, bounds.height / 2 - 60)
consoleEditor.setSize(bounds.width - 80, 40)

const registerSW = async () => {
  if ('serviceWorker' in navigator)
    try {
      await navigator.serviceWorker.register('../sw.js')
    } catch (e) {
      console.log(`SW registration failed`)
    }
}

window.addEventListener('load', registerSW)
editor.setValue(`<- [SKETCH; MATH] [LIBRARY]; 
<- [sketch; background; line; circle; rectangle; polygon; text; write; group; add; add_to; fill; stroke; fill_style; draw; move; scale; rotate; opacity] [SKETCH];
<- [random_int] [MATH];
sketch [400; 280];
;; fill style can be hachure solid zigzag cross-hatch dots sunburst dashed or zigzag-line
|> [group []; 
    add [|> [circle [105; 105; 45];
                 fill ["gray"]; 
                 fill_style ["solid"]; 
                 stroke ["none"]; 
                 draw []; 
                 opacity [0.8]]]; 
    add [|> [circle [100; 100; 50];
                 fill ["red"]; 
                 fill_style ["solid"]; 
                 stroke ["none"]; 
                 draw []]];
    add [|> [text ["ball"]; 
             fill ["black"]; 
             write []; 
             move [90; 130]]];
    move [170; 100]]
`)
