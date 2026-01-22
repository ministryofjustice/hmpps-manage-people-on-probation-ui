import { isoFromDateTime } from './isoFromDateTime'

describe('utils/isoFromDateTime', () => {
  it('should return an ISO date', () => {
    expect(isoFromDateTime('22/01/2026', '17:05')).toEqual('2026-01-22T17:05:00.000Z')
  })
})
