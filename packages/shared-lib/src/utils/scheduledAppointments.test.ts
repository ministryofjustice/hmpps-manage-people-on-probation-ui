import { scheduledAppointments } from './scheduledAppointments'
import { appointments } from './mocks'
import { Activity } from '../data/model/schedule'

describe('utils/scheduledAppointments', () => {
  it('should filter and sort future appointments in date order', () => {
    const result: Activity[] = scheduledAppointments(appointments)
    const expectedOrder = [0, 1, 6]
    const expected = expectedOrder.map(index => appointments[index])
    expect(result).toStrictEqual(expected)
  })
})
