export const NoCodeRegExp = /[ ]+(?=[^"]*(?:"[^"]*"[^"]*)*$)+|\n|\t|;;.+/g
export const extractComments = (source) =>
  (source.match(NoCodeRegExp) ?? []).filter((x) => x[0] === ';' && x[1] === ';')
export const handleHangingSemi = (source) =>
  source[source.length - 1] === ';'
    ? source.substring(0, source.length - 1)
    : source

export const removeNoCode = (source) => source.replace(NoCodeRegExp, '')
export const wrapInBody = (source) => `:[${source}]`
