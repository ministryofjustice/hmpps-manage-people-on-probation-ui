import { to12HourTimeCompact } from './to12HourTimeCompact'

describe('to12HourTimeCompact', () => {
  it('formats midnight correctly', () => {
    expect(to12HourTimeCompact('00:00')).toBe('12am')
  })

  it('formats morning time without minutes', () => {
    expect(to12HourTimeCompact('09:00')).toBe('9am')
  })

  it('formats morning time with minutes', () => {
    expect(to12HourTimeCompact('09:30')).toBe('9:30am')
  })

  it('formats noon correctly', () => {
    expect(to12HourTimeCompact('12:00')).toBe('12pm')
  })

  it('formats afternoon time without minutes', () => {
    expect(to12HourTimeCompact('15:00')).toBe('3pm')
  })

  it('formats afternoon time with minutes', () => {
    expect(to12HourTimeCompact('15:45')).toBe('3:45pm')
  })
})
