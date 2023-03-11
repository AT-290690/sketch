const tailCallOpt = (children, name, parent) => {
  for (let i = 0; i < children.length; ++i)
    if (children[i].args)
      if (name in children[i]?.operator && children[i].operator.name === name) {
        children[i].operator.name = '__tail_' + name
        children[i] = {
          args: [children[i]],
          class: 'function',
          operator: { type: 'word', name: '->' },
          type: 'apply',
        }
        parent[1] = {
          args: [
            {
              class: 'function',
              operator: { type: 'word', name: ':=' },
              type: 'apply',
              args: [{ type: 'word', name: '__tail_' + name }, parent[1]],
            },
          ],
          class: 'function',
          operator: { type: 'word', name: 'tco' },
          type: 'apply',
        }
        break
      } else tailCallOpt(children[i].args, name, parent)
}
const importArgs = (expr) =>
  (expr.args = expr.args.map((arg) => {
    arg.type = 'import'
    arg.class = 'function'
    return arg
  }))

const pipeDfs = (stack, parent) => {
  const current = stack.pop()
  if (current) {
    parent.unshift(current)
    pipeDfs(stack, current.args)
  }
}
const pipeArgs = (expr) => {
  const [first, ...rest] = expr.args
  if (!first) throw new TypeError(`Invalid number of arguments for |> []`)
  if (!rest.every((x) => x.class === 'function' && x.operator.name))
    throw new TypeError(`Following arguments of|> [] must be -> []`)
  expr.args = []
  rest.unshift(first)
  pipeDfs(rest, expr.args)
}
export const parseApply = (expr, program) => {
  if (program[0] !== '[') return { expr: expr, rest: program }
  program = program.slice(1)
  expr = {
    type: 'apply',
    operator: expr,
    args: [],
    class: 'function',
  }
  while (program[0] !== ']') {
    const arg = parseExpression(program)
    expr.args.push(arg.expr)
    program = arg.rest
    if (program[0] === ';') program = program.slice(1)
    else if (program[0] !== ']') {
      throw new SyntaxError(
        `Unexpected token - Expected ';' or ']'" but got "${program[0]}"`
      )
    }
  }
  if (expr.operator.name === '|>') pipeArgs(expr)
  else if (expr.operator.name === '<-') importArgs(expr)
  else if (expr.operator.name === '~=')
    tailCallOpt(expr.args, expr.args[0].name, expr.args)
  return parseApply(expr, program.slice(1))
}
export const parseExpression = (program) => {
  let match, expr
  if ((match = /^"([^"]*)"/.exec(program)))
    expr = {
      type: 'value',
      value: match[1],
      class: 'string',
    }
  else if ((match = /^-?\d*\.{0,1}\d+\b/.exec(program)))
    expr = {
      type: 'value',
      value: Number(match[0]),
      class: 'number',
    }
  else if ((match = /^[^\s\[\];"]+/.exec(program)))
    expr = { type: 'word', name: match[0] }
  else {
    const snapshot = ' ' + program.split('];')[0].split(']')[0].trim()
    throw new SyntaxError(`Unexpect syntax: "${snapshot}"`)
  }
  return parseApply(expr, program.slice(match[0].length))
}
export const parse = (program) => {
  const result = parseExpression(program)
  if (result.rest.length > 0) {
    throw new SyntaxError('Unexpected text after program')
  }
  return result.expr
}
