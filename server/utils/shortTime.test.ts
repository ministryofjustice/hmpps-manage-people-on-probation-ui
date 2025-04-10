import { shortTime } from './shortTime'

describe('utils/shortTime', () => {
  it('short return the correct format if time has minutes', () => {
    expect(shortTime('2024-05-25T09:08:34.123')).toEqual('9:08am')
    expect(shortTime('2024-05-25T13:08:34.123')).toEqual('1:08pm')
  })
  it('short return the correct format if time does not have minutes', () => {
    expect(shortTime('2024-05-25T09:00:00.123')).toEqual('9am')
    expect(shortTime('2024-05-25T13:00:00.123')).toEqual('1pm')
  })
})
