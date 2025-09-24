export const escapeQuotes = (str: string): string => {
  if (!str) return str
  return str.replaceAll('"', '\\"')
}
