import { DateTime } from 'luxon'

export const standardiseDateValue = (dateValue: string | undefined): string | undefined => {
  if (!dateValue) {
    return dateValue
  }
  const separators = ['/', '-', '.', ' ', '_']
  const formats: string[] = []
  for (let i = 0; i < separators.length; i += 1) {
    const seperator = separators[i]
    formats.push(`d${seperator}M${seperator}yyyy`)
    formats.push(`d${seperator}M${seperator}yy`)
  }
  for (let j = 0; j < formats.length; j += 1) {
    const format = formats[j]
    const date = DateTime.fromFormat(dateValue, format)
    if (date.isValid) {
      const newDateValue = date.toFormat('d/M/yyyy')
      return newDateValue
    }
  }
  return dateValue
}
