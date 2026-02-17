import { govukTime } from './govukTime'

export const timeFromTo = (from: string, to: string) => {
  const timeFrom = govukTime(from)
  const timeTo = govukTime(to)
  if (timeTo === null) {
    return timeFrom
  }
  return `${timeFrom} to ${timeTo}`
}
