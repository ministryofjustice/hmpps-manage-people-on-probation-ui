import { isoToDateTime } from './isoToDateTime'

describe('utils/isoToDateTime', () => {
  it('should return the date and time', () => {
    expect(isoToDateTime('2026-01-22T17:05:53.994Z')).toStrictEqual({ date: '2026-01-22', time: '17:05' })
  })
})
