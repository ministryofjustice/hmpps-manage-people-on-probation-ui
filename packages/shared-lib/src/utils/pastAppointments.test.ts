import { appointments } from './mocks'
import { pastAppointments } from './pastAppointments'

describe('utils/pastAppointments', () => {
  const expectedOrder = [2, 3, 4, 5]
  const expected = expectedOrder.map(index => appointments[index])
  it('should return the appointments in the past in date order', () => {
    expect(pastAppointments(appointments)).toEqual(expected)
  })
})
