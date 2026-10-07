export const handleQuotes = (str: string, mode = 'escape'): string => {
  if (!str) return str
  if (mode === 'escape') {
    return str.replaceAll('"', String.raw`\"`)
  }
  if (mode === 'unescape') {
    return str.replaceAll(String.raw`\"`, '"')
  }
  return str
}
