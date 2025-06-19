import { dateTime } from './dateTime'

describe('utils/dateTime', () => {
  it.each([
    ['converts correctly', '2025-07-10', '9:00pm', '2025-07-10T21:00:00.000Z'],
    ['converts correctly', '2025-07-10', '9:00am', '2025-07-10T09:00:00.000Z'],
  ])('%s dateTime(%s)', (_: string, date: string, time: string, expected: string) => {
    expect(dateTime(date, time).toISOString()).toEqual(expected)
  })
})
