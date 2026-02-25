export const handleQuotes = (str: string, mode = 'escape'): string => {
  if (!str) return str
  if (mode === 'escape') {
    return str.replaceAll('"', '\\"')
  }
  if (mode === 'unescape') {
    return str.replaceAll('\\"', '"')
  }
  return str
}
