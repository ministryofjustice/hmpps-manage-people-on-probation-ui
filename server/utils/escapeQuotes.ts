export const escapeQuotes = (input: string): string => {
  if (!input) return input
  return input.replace(/"/g, '\\"').replace(/'/g, "\\'")
}
