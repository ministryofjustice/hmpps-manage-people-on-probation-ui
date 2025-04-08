import { sortAppointmentsDescending } from './sortAppointmentsDescending'
import { Activity } from '../data/model/schedule'
import { appointments } from './mocks'

describe('utils/sortAppointmentsDescending', () => {
  it('should sort and limit the appointments correctly if limit is set to 3', () => {
    const result: Activity[] = sortAppointmentsDescending(appointments, 3)
    const expectedOrder = [0, 1, 6]
    const expected = expectedOrder.map(index => appointments[index])
    expect(result).toStrictEqual(expected)
    expect(result).toHaveLength(3)
  })
  it('should return all the sorted appointments if no limit is set', () => {
    const result: Activity[] = sortAppointmentsDescending(appointments, undefined)
    const expectedOrder = [0, 1, 6, 2, 3, 4, 5]
    const expected = expectedOrder.map(index => appointments[index])
    expect(result).toStrictEqual(expected)
    expect(result).toHaveLength(appointments.length)
  })
})
