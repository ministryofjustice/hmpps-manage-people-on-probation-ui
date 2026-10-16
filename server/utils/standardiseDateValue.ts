import { DateTime } from 'luxon'

export const standardiseDateValue = (dateValue: string | undefined): string | undefined => {
  if (!dateValue) {
    return dateValue
  }
  const separators = ['/', '-', '.', ' ', '_', ':']
  const formats: string[] = []
  for (const seperator of separators) {
    formats.push(`d${seperator}M${seperator}yyyy`, `d${seperator}M${seperator}yy`)
  }
  for (const format of formats) {
    const date = DateTime.fromFormat(dateValue, format)
    if (date.isValid) {
      return date.toFormat('d/M/yyyy')
    }
  }
  return dateValue
}
