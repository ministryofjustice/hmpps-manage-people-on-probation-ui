import { to12HourTimeWithMinutes } from './to12HourTimeWithMinutes'

describe('to12HourTimeWithMinutes', () => {
  it('formats midnight correctly', () => {
    expect(to12HourTimeWithMinutes('00:00')).toBe('12:00am')
  })

  it('formats morning time without leading zero on hour', () => {
    expect(to12HourTimeWithMinutes('09:00')).toBe('9:00am')
  })

  it('formats morning time with minutes', () => {
    expect(to12HourTimeWithMinutes('09:15')).toBe('9:15am')
  })

  it('formats noon correctly', () => {
    expect(to12HourTimeWithMinutes('12:00')).toBe('12:00pm')
  })

  it('formats afternoon time', () => {
    expect(to12HourTimeWithMinutes('16:05')).toBe('4:05pm')
  })

  it('pads minutes with leading zero when needed', () => {
    expect(to12HourTimeWithMinutes('13:05')).toBe('1:05pm')
  })
})
