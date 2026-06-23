export const convertToLowerCase = (
  str: string,
  { preserveCapWords = true, preserveWords = [] }: { preserveCapWords?: boolean; preserveWords?: string[] } = {},
): string => {
  if (!str) return ''
  const words = str.split(' ')
  return words
    .map(word => {
      if ((preserveCapWords && word === word.toUpperCase()) || preserveWords.includes(word)) {
        return word
      }
      return word.toLowerCase()
    })
    .join(' ')
}
