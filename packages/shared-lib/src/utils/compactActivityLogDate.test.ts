import { DateTime } from 'luxon'
import { compactActivityLogDate } from './compactActivityLogDate'

describe('utils/compactActivityLogDate', () => {
  it.each([
    ['Null', null, null],
    ['gets day', '2024-05-25T09:08:34.123', 'Sat 25 May 2024'],
    ['today', DateTime.now(), 'Today'],
    ['yesterday', DateTime.now().plus({ days: -1 }), 'Yesterday'],
  ])('%s compactActivityLogDate(%s, %s)', (_: string, a: string, expected: string) => {
    expect(compactActivityLogDate(a)).toEqual(expected)
  })
})
