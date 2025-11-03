import { isBlank } from './isBlank'

export const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

export const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

const regex = /\(([A-Z]+(?:[- ][A-Z]+)*)\)/g

export const convertToTitleCase = (sentence: string, ignore: string[] = []): string => {
  if (isBlank(sentence)) return ''
  return sentence
    .split(' ')
    .map(word => {
      if (ignore.includes(word) || regex.test(word)) {
        return word
      }
      return properCaseName(word)
    })
    .join(' ')
}
