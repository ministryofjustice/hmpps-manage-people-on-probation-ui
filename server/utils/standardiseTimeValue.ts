import { DateTime } from 'luxon'

export const standardiseTimeValue = (timeValue: string | undefined): string | undefined => {
  if (!timeValue) {
    return timeValue
  }
  const separators = [':', '/', '-', '.', ' ', '_']
  const formats: string[] = []
  for (let i = 0; i < separators.length; i += 1) {
    const seperator = separators[i]
    formats.push(`H${seperator}mm`)
    formats.push(`h${seperator}mma`)
  }
  for (let j = 0; j < formats.length; j += 1) {
    const format = formats[j]
    const time = DateTime.fromFormat(timeValue, format)
    if (time.isValid) {
      const newTimeValue = time.toFormat('HH:mm')
      return newTimeValue
    }
  }
  return timeValue
}
