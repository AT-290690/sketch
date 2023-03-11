const sanitizeProp = (prop) => {
  if (
    prop.includes('constructor') ||
    prop.includes('prototype') ||
    prop.includes('__proto__')
  )
    throw new TypeError(`Forbidden property access ${prop}`)
  return prop
}
const semiColumnEdgeCases = new Set([
  ';)',
  ';-',
  ';+',
  ';*',
  ';%',
  ';&',
  ';/',
  ';:',
  ';.',
  ';=',
  ';<',
  ';>',
  ';|',
  ';,',
  ';?',
  ',,',
  ';;',
  ';]',
])

const compile = () => {
  const vars = new Set()
  let modules = {}
  const dfs = (tree, locals) => {
    if (!tree) return ''
    if (tree.type === 'apply') {
      switch (tree.operator.name) {
        case ':': {
          if (tree.args.length > 1) {
            return `(()=>{${tree.args
              .map((x, i) => {
                const res = dfs(x, locals)
                return res !== undefined && i === tree.args.length - 1
                  ? ';return ' + res.toString().trimStart()
                  : res
              })
              .join('')}})()`
          } else {
            const res = dfs(tree.args[0], locals)
            return res !== undefined ? res.toString().trim() : ''
          }
        }
        case ':=': {
          let name,
            out = '(('
          for (let i = 0, len = tree.args.length; i < len; ++i) {
            if (i % 2 === 0) {
              name = tree.args[i].name
              locals.add(name)
            } else
              out += `${name}=${dfs(tree.args[i], locals)}${
                i !== len - 1 ? ',' : ''
              }`
          }
          out += `), ${name});`
          return out
        }
        case '<-::': {
          let out = '(('
          const obj = dfs(tree.args.pop(), locals)
          for (let i = 0, len = tree.args.length; i < len; ++i) {
            let name = tree.args[i].name
            locals.add(name)
            out += `${name}=${obj}.get(${`"${name}"`})${
              i !== len - 1 ? ',' : ''
            }`
          }
          out += `));`

          return out
        }
        case '<-.:': {
          let out = '(('
          const obj = dfs(tree.args.pop(), locals)
          for (let i = 0, len = tree.args.length; i < len; ++i) {
            let name = tree.args[i].name
            locals.add(name)
            if (i !== len - 1) out += `${name}=${obj}.at(${i}),`
            else out += `${name}=${obj}.slice(${i})`
          }
          out += `));`

          return out
        }
        case '~=': {
          const res = dfs(tree.args[1], locals)
          const name = tree.args[0].name
          locals.add(name)
          if (res !== undefined) return `((${name}=${res}),${name});`
          break
        }
        case '=': {
          const res = dfs(tree.args[1], locals)
          return `((${tree.args[0].name}=${res}),${tree.args[0].name});`
        }
        case '->': {
          const args = tree.args
          const body = args.pop()
          const localVars = new Set()
          const evaluatedBody = dfs(body, localVars)
          const vars = localVars.size ? `var ${[...localVars].join(',')};` : ''
          return `(${args.map((x) => dfs(x, locals))}) => {${vars} ${
            body.type === 'apply' || body.type === 'value' ? 'return ' : ' '
          } ${evaluatedBody.toString().trimStart()}};`
        }
        case '~':
          return '(' + tree.args.map((x) => dfs(x, locals)).join('+') + ');'
        case '==':
          return '(' + tree.args.map((x) => dfs(x, locals)).join('===') + ');'
        case '!=':
          return '(' + tree.args.map((x) => dfs(x, locals)).join('!==') + ');'
        case '+':
        case '-':
        case '*':
        case '/':
        case '>=':
        case '<=':
        case '>':
        case '<':
          return (
            '(' +
            tree.args.map((x) => dfs(x, locals)).join(tree.operator.name) +
            ');'
          )
        case '&&':
        case '||':
          return (
            '(' +
            tree.args
              .map((x) => `(${dfs(x, locals)})`)
              .join(tree.operator.name) +
            ');'
          )
        case '%':
          return (
            '(' +
            dfs(tree.args[0], locals) +
            '%' +
            dfs(tree.args[1], locals) +
            ');'
          )
        case '|':
          return `(${dfs(tree.args[0], locals)}.toFixed(
          ${tree.args.length === 1 ? 0 : dfs(tree.args[1], locals)}
        ));`
        case '+=':
          return `(${dfs(tree.args[0], locals)}+=${
            tree.args[1] != undefined ? dfs(tree.args[1], locals) : 1
          });`
        case '-=':
          return `(${dfs(tree.args[0], locals)}-=${
            tree.args[1] != undefined ? dfs(tree.args[1], locals) : 1
          });`
        case '*=':
          return `(${dfs(tree.args[0], locals)}*=${
            tree.args[1] != undefined ? dfs(tree.args[1], locals) : 1
          });`
        case '!':
          return '!' + dfs(tree.args[0], locals)

        case '?': {
          const conditionStack = []
          tree.args
            .map((x) => dfs(x, locals))
            .forEach((x, i) =>
              i % 2 === 0
                ? conditionStack.push(x, '?')
                : conditionStack.push(x, ':')
            )
          conditionStack.pop()
          if (conditionStack.length === 3) conditionStack.push(':', 'null;')
          return `(${conditionStack.join('')});`
        }

        case '*loop':
          return `Inventory._repeat(${dfs(tree.args[0], locals)},${dfs(
            tree.args[1],
            locals
          )});`
        case '===': {
          const [first, ...rest] = tree.args
          return `Inventory.of(${rest
            .map((x) => dfs(x, locals))
            .join(',')}).every(x => Inventory.of(${dfs(
            first,
            locals
          )}).isEqual(Inventory.of(x)));`
        }
        case '!==': {
          const [first, ...rest] = tree.args
          return `Inventory.of(${rest
            .map((x) => dfs(x, locals))
            .join(',')}).every(x => !Inventory.of(${dfs(
            first,
            locals
          )}).isEqual(Inventory.of(x)));`
        }
        case '`':
          return `Inventory._cast(${dfs(tree.args[0], locals)})`
        case '.:difference':
          return `${dfs(tree.args[0], locals)}.difference(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:intersection':
          return `${dfs(tree.args[0], locals)}.intersection(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:xor':
          return `${dfs(tree.args[0], locals)}.xor(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:union':
          return `${dfs(tree.args[0], locals)}.union(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:seq':
          return `Inventory._fill(${dfs(tree.args[0], locals)});`
        case '.:find>>':
          return `${dfs(tree.args[0], locals)}.find(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:find<<':
          return `${dfs(tree.args[0], locals)}.findLast(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:every':
          return `${dfs(tree.args[0], locals)}.every(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:some':
          return `${dfs(tree.args[0], locals)}.some(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:find_index>>':
          return `${dfs(tree.args[0], locals)}.findIndex(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:find_index<<':
          return `${dfs(tree.args[0], locals)}.findLastIndex(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:first':
          return `${dfs(tree.args[0], locals)}.get(0);`
        case '.:last':
          return `${dfs(tree.args[0], locals)}.at(-1);`
        case '^':
          return `${dfs(tree.args[0], locals)}.at(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:is_in_bounds':
          return `${dfs(tree.args[0], locals)}.isInBounds(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:matrix':
          return `Inventory.matrix(${tree.args
            .map((x) => dfs(x, locals))
            .join(',')});`
        case '.:':
          return (
            'Inventory.of(' +
            tree.args.map((x) => dfs(x, locals)).join(',') +
            ')'
          )
        case '^=':
          return `${dfs(tree.args[0], locals)}.set(${dfs(
            tree.args[1],
            locals
          )}, ${dfs(tree.args[2], locals)});`
        case '.:append':
          return `${dfs(tree.args[0], locals)}.append(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:prepend':
          return `${dfs(tree.args[0], locals)}.prepend(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:head':
          return `${dfs(tree.args[0], locals)}.head();`
        case '.:tail':
          return `${dfs(tree.args[0], locals)}.tail();`
        case '.:cut':
          return `${dfs(tree.args[0], locals)}.cut();`
        case '.:chop':
          return `${dfs(tree.args[0], locals)}.chop();`
        case '.:from_string':
          return `Inventory._split(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )});`
        case '.:to_string':
          return `${dfs(tree.args[0], locals)}.join(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:chunks':
          return `${dfs(tree.args[0], locals)}.partition(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:length':
          return `${dfs(tree.args[0], locals)}.length;`
        case '::size':
          return `${dfs(tree.args[0], locals)}.size;`
        case 'tco':
          return 'Inventory._tco(' + dfs(tree.args[0], locals) + ');'
        case '...':
          return `Inventory._spreadArr([${tree.args
            .map((x) => dfs(x, locals))
            .join(',')}]);`
        case '|>': {
          return `(${dfs(tree.args[0], locals)});`
        }

        case '.:quick_sort': {
          return `${dfs(tree.args[0], locals)}.quickSort(${dfs(
            tree.args[1],
            locals
          )});`
        }
        case '.:merge_sort': {
          return `${dfs(tree.args[0], locals)}.mergeSort(${dfs(
            tree.args[1],
            locals
          )});`
        }
        case '.:group': {
          return `${dfs(tree.args[0], locals)}.group(${dfs(
            tree.args[1],
            locals
          )});`
        }

        case '::':
          return (
            'new Map([' +
            tree.args
              .map((x) => dfs(x, locals))
              .reduce((acc, item, index) => {
                if (index % 2 === 0) {
                  const key = item.replace(';', '')
                  acc +=
                    key[0] === '"'
                      ? `["${key.replaceAll('"', '')}",`
                      : `[${key},`
                } else acc += `${item}],`
                return acc
              }, '') +
            '])'
          )
        case "'": {
          const names = tree.args.map(({ name }) => {
            locals.add(name)
            return `${name} = "${name}"`
          })

          return `((${names.join(',')}),${
            tree.args[tree.args.length - 1].name
          });`
        }
        case '.?':
          return `${dfs(tree.args[0], locals)}.has(${dfs(
            tree.args[1],
            locals
          )});`
        case '.':
          return `${dfs(tree.args[0], locals)}.get(${dfs(
            tree.args[1],
            locals
          )});`
        case '.=':
          return `Inventory._mapSet(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )}, ${dfs(tree.args[2], locals)});`
        case '.!=':
          return `Inventory._mapRemove(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )});`
        case '?==':
          return `Inventory._checkType(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )});`
        case '!throw':
          return `Inventory._throw(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )});`
        case '::entries':
          return `Inventory._mapEntries(${dfs(tree.args[0], locals)});`
        case '.:add_at': {
          const [first, second, ...rest] = tree.args.map((item) =>
            dfs(item, locals)
          )
          return `${first}.addAt(${second}, ...${rest});`
        }
        case '.:remove_from':
          return `${dfs(tree.args[0], locals)}.removeFrom(${dfs(
            tree.args[1],
            locals
          )}, ${dfs(tree.args[2], locals)});`
        case '::values':
          return `Inventory._mapValues(${dfs(tree.args[0], locals)});`
        case '::keys':
          return `Inventory._mapKeys(${dfs(tree.args[0], locals)});`
        case '.:rotate':
          return `${dfs(tree.args[0], locals)}.rotate(${dfs(
            tree.args[1],
            locals
          )}, ${dfs(tree.args[2], locals)});`
        case '.:slice':
          return `${dfs(tree.args[0], locals)}.slice(${dfs(
            tree.args[1],
            locals
          )}, ${dfs(tree.args[2], locals)});`
        case '.:flat':
          return `${dfs(tree.args[0], locals)}.flat(${dfs(
            tree.args[1],
            locals
          )});`
        case '>>':
          return `${dfs(tree.args[0], locals)}.scan(${dfs(
            tree.args[1],
            locals
          )}, 1);`
        case '<<':
          return `${dfs(tree.args[0], locals)}.scan(${dfs(
            tree.args[1],
            locals
          )}, -1);`
        case '.:map>>':
          return `${dfs(tree.args[0], locals)}.map(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:map<<':
          return `${dfs(tree.args[0], locals)}.mapRight(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:flatten':
          return `${dfs(tree.args[0], locals)}.flatten(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:filter':
          return `${dfs(tree.args[0], locals)}.filter(${dfs(
            tree.args[1],
            locals
          )});`
        case '.:reduce>>': {
          const [array, callback, out] = tree.args.map((x) => dfs(x, locals))
          return `${array}.reduce(${callback}, ${out});`
        }
        case '.:reduce<<': {
          const [array, callback, out] = tree.args.map((x) => dfs(x, locals))
          return `${array}.reduceRight(${callback}, ${out});`
        }
        case '=>': {
          return `Inventory._call(${dfs(tree.args[0], locals)}, ${dfs(
            tree.args[1],
            locals
          )});`
        }
        case '~*': {
          const module = dfs(tree.args.pop(), locals)
          const links = `[${tree.args.map((x) => dfs(x, locals)).join(',')}]`
          const out = `Promise.all(${links}.map(f => fetch(f).then(r => r.text())))
          .then(encodes => {
            const callback = ${module}
            const signals = Inventory.from(encodes.map((encode => buildModule(decodeBase64(decodeURIComponent(encode.trim()))))))
            ;callback(signals)
          })`
          return out
        }
        default: {
          if (tree.operator.name)
            return (
              tree.operator.name +
              '(' +
              tree.args.map((x) => dfs(x, locals)).join(',') +
              ');'
            )
          else {
            if (tree.operator.operator.name === '<-') {
              const lib = tree.args[0]
              const imp =
                lib.type === 'word' ? lib.name : dfs(lib, locals).slice(0, -1)
              const methods = tree.operator.args.map((x) =>
                sanitizeProp(x.name)
              )
              return methods
                .map((method) => {
                  if (method) {
                    locals.add(method)
                    if (imp in modules) modules[imp].push(method)
                    else modules[imp] = [method]
                  }
                  return `${method} = ${imp}["${method}"];`
                })
                .join('')
            } else {
              return `(${dfs(tree.operator, locals)})(${tree.args
                .map((x) => dfs(x, locals))
                .join(',')});`
            }
          }
        }
      }
    } else if (tree.type === 'word') return tree.name
    else if (tree.type === 'value')
      return tree.class === 'string' ? `"${tree.value}"` : tree.value
  }
  return { dfs, vars, modules }
}

export const compileToJs = (AST) => {
  const { dfs, vars, modules } = compile()
  const raw = dfs(AST, vars)
  let program = ''
  for (let i = 0; i < raw.length; ++i) {
    const current = raw[i]
    const next = raw[i + 1]
    if (!semiColumnEdgeCases.has(current + next)) program += current
  }
  const top = vars.size ? `var ${[...vars].join(',')};` : ''
  return { top, program, modules }
}
