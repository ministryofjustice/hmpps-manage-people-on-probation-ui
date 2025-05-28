export const escapeForLog = (input: unknown): string => {
  if (!input) return ''
  return String(input)
    .replace(/[\r\n\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
