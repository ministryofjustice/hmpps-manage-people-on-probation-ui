import { dateTime } from './dateTime'

describe('utils/dateTime', () => {
  it.each([
    ['converts correctly to Zulu time', '2025-07-10', '9:00pm', 2025],
    ['converts correctly to Zulu time', '2025-07-10', '9:00am', 2025],
  ])('%s dateTime(%s)', (_: string, date: string, time: string, expected: number) => {
    expect(dateTime(date, time).getFullYear()).toEqual(expected)
  })
})
