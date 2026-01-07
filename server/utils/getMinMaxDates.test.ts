import { getMinMaxDates } from './getMinMaxDates'

describe('getMinMaxDates()', () => {
  it('should return correct dates for single digit day', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
    expect(getMinMaxDates()).toEqual({ _maxDate: '31/12/2199', _minDate: '1/7/2025' })
  })
  it('should return correct dates for double digit day', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-10-10T09:00:00Z')) // 10:00 BST
    expect(getMinMaxDates()).toEqual({ _maxDate: '31/12/2199', _minDate: '10/10/2025' })
  })
})
