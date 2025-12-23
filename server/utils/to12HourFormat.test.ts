import to12HourFormat from './to12HourFormat'

describe('to12HourFormat', () => {
  it('converts HH:mm', () => {
    expect(to12HourFormat('13:30')).toBe('1:30pm')
  })

  it('converts ISO time', () => {
    expect(to12HourFormat('2025-12-01T01:00:00Z')).toBe('1:00am')
  })
})
