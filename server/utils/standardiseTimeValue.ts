import { DateTime } from 'luxon'

export const standardiseTimeValue = (timeValue: string | undefined): string | undefined => {
  if (!timeValue) {
    return timeValue
  }
  const separators = [':', '/', '-', '.', ' ', '_']
  const formats: string[] = []
  for (const seperator of separators) {
    formats.push(`H${seperator}mm`)
    formats.push(`h${seperator}mma`)
  }
  for (const format of formats) {
    const time = DateTime.fromFormat(timeValue, format)
    if (time.isValid) {
      const newTimeValue = time.toFormat('HH:mm')
      return newTimeValue
    }
  }
  return timeValue
}
