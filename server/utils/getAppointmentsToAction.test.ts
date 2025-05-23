import { Activity } from '../data/model/schedule'
import { getAppointmentsToAction } from './getAppointmentsToAction'
import { appointments } from './mocks'

describe('appointments to action', () => {
  it.each([
    ['Filters absent awating evidence', appointments, 'evidence', appointments[3]],
    ['Filters no outcome', appointments, 'outcome', appointments[4]],
  ])('%s getAppointmentsToAction(%s, %s)', (_: string, a: Activity[], b: string, appointment: Activity) => {
    expect(getAppointmentsToAction(a, b)[0]).toEqual(appointment)
  })
})
