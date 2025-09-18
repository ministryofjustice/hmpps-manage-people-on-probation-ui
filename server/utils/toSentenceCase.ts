import config from '../config'

const capsRegex = /^[A-Z]+(?:\/[A-Z]+)*$/

export const toSentenceCase = (
  value: string | null | undefined,
  preserveWords: string[] = [],
  preserveSeparators: string[] | null = null,
  leadingCaps: boolean = true,
): string => {
  if (!value) return ''
  const preservedWords = [...preserveWords, ...config.preservedWords]
  const preservedSeparators = preserveSeparators ?? config.preservedSeparators
  const words = value.split(' ')
  const separators = ['-', '_']
  const formatWord = (word: string) => {
    if (preservedWords.includes(word) || preservedSeparators.includes(word)) {
      return word
    }
    let formattedWord = word
    separators.forEach(separator => {
      if (!preservedSeparators.includes(separator)) {
        formattedWord = formattedWord.split(separator).join(' ')
      }
    })
    return formattedWord
      .split(' ')
      .map(subWord => {
        if (preservedWords.includes(subWord) || capsRegex.test(subWord)) {
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
  return leadingCaps ? `${formatted.charAt(0).toUpperCase()}${formatted.substring(1)}` : `${formatted}`
}
