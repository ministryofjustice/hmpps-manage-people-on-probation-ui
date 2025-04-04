import { sortAppointmentsDescending } from './sortAppointmentsDescending'
import { Activity } from '../data/model/schedule'
import { appointments } from './mocks'

describe('utils/sortAppointmentsDescending', () => {
  it.each([
    ['sorts and limits correctly', appointments, 3, 3],
    ['sorts and does not limit', appointments, undefined, 7],
  ])('%s sortAppointmentsDescending(%s, %s)', (_: string, a: Activity[], limit: number, expectedSize: number) => {
    const result = sortAppointmentsDescending(a, limit)
    expect(result[0]).toEqual(appointments[0])
    expect(result.length).toEqual(expectedSize)
  })
})
