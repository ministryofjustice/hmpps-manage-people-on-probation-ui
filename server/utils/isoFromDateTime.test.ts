import { isoFromDateTime } from './isoFromDateTime'

describe('utils/isoFromDateTime', () => {
  it('should return an ISO date', () => {
    expect(isoFromDateTime('2026-06-22', '17:05')).toEqual('2026-06-22T17:05:00.000+01:00')
  })
})
