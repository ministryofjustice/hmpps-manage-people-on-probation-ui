import { isoToDateTime } from './isoToDateTime'

describe('utils/isoToDateTime', () => {
  it('should return the date and time', () => {
    expect(isoToDateTime('2026-06-22T17:05:53.994+01:00')).toStrictEqual({ date: '2026-06-22', time: '17:05' })
  })
})
