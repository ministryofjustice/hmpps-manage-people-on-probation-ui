export const splitString = (str: string, separator: string = ','): string[] => {
  if (typeof str !== 'string') {
    return str
  }
  const sep = typeof separator === 'string' ? separator : String(separator)
  return str.split(sep).map(item => item.trim())
}
