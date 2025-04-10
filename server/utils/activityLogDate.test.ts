import { DateTime } from 'luxon'
import { activityLogDate } from './activityLogDate'

describe('utils/activityLogDate', () => {
  it.each([
    ['Null', null, null],
    ['gets day', '2024-05-25T09:08:34.123', 'Saturday 25 May 2024'],
    ['today', DateTime.now(), 'Today'],
    ['yesterday', DateTime.now().plus({ days: -1 }), 'Yesterday'],
  ])('%s activityLogDate(%s, %s)', (_: string, a: string, expected: string) => {
    expect(activityLogDate(a)).toEqual(expected)
  })
})
