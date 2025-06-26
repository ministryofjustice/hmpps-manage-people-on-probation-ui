export const toSentenceCase = (
  value: string | null | undefined,
  preserveWords: string[] = [],
  ignoreSeparators: string[] = [],
): string => {
  if (!value) return ''
  const words = value.split(' ')
  const separators = ['-', '_']
  const formatWord = (word: string) => {
    if (preserveWords.includes(word) || ignoreSeparators.includes(word)) {
      return word
    }
    let formattedWord = word
    separators.forEach(separator => {
      if (!ignoreSeparators.includes(separator)) {
        formattedWord = formattedWord.split(separator).join(' ')
      }
    })
    return formattedWord
      .split(' ')
      .map(subWord => {
        if (preserveWords.includes(subWord)) {
          return subWord
        }
        return subWord.toLowerCase()
      })
      .join(' ')
  }
  const formatted = words
    .map((word, i) => {
      return formatWord(word)
    })
    .join(' ')
  return `${formatted.charAt(0).toUpperCase()}${formatted.substring(1)}`
}
