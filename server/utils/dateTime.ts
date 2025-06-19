export const dateTime = (date: string, time: string): Date => {
  const isPm = time.includes('pm')
  const [hour, minute] = time
    .split('am')
    .join('')
    .split('pm')
    .join('')
    .split(':')
    .map(val => parseInt(val, 10))
  const newHour = isPm && hour !== 12 ? hour + 12 : hour
  const [year, month, day] = date.split('-').map(val => parseInt(val, 10))
  return new Date(year, month - 1, day, newHour, minute, 0)
}
