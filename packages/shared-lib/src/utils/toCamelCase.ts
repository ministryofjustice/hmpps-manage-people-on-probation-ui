export const toCamelCase = (str: string): string => {
  return str
    .replace('-', ' ')
    .split(' ')
    .map((word, i) => {
      return i > 0 ? `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}` : word.toLowerCase()
    })
    .join('')
}
