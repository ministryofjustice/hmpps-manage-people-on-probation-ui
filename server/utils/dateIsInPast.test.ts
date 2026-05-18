import { DateTime } from 'luxon'
import { dateIsInPast } from './dateIsInPast'

describe('utils/dateIsInPast', () => {
  const now = DateTime.now()
  const today = now.toFormat('yyyy-M-d')
  it('should return false if no date', () => {
    expect(dateIsInPast(undefined)).toEqual({ isInPast: false, isToday: false })
  })
  it('should return false if a future date', () => {
    const tomorrow = now.plus({ days: 1 }).toFormat('yyyy-M-d')
    expect(dateIsInPast(tomorrow)).toEqual({ isInPast: false, isToday: false })
  })
  it('should return true if date is in past', () => {
    const yesterday = now.minus({ days: 1 }).toFormat('yyyy-M-d')
    expect(dateIsInPast(yesterday)).toEqual({ isInPast: true, isToday: false })
  })
  it('should return false if date is today and start time is in future', () => {
    const timeInFuture = now.plus({ hours: 1 }).toFormat('HH:mm')
    expect(dateIsInPast(today, timeInFuture)).toEqual({ isInPast: false, isToday: true })
  })
  it('should return true if date is today and start time is in past', () => {
    const timeInPast = now.minus({ hours: 1 }).toFormat('HH:mm')
    expect(dateIsInPast(today, timeInPast)).toEqual({ isInPast: true, isToday: true })
  })
})
