import { dateToTimestamp } from './dateToTimestamp'

describe('utils/dateToTimestamp', () => {
  it.each([
    ['returns null', '', null],
    ['converts correctly to timestamp', '2023-04-06T11:06:25.672587+01:00', 1680775585672],
    ['converts correctly to timestamp', '2024-03-06T14:17:00Z', 1709734620000],
  ])('%s dateToTimestamp(%s)', (_: string, date: string, expected: number | null) => {
    expect(dateToTimestamp(date)).toEqual(expected)
  })
})
