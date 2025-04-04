import { scheduledAppointments } from './scheduledAppointments'
import { appointments } from './mocks'
import { Activity } from '../data/model/schedule'

describe('utils/scheduledAppointments', () => {
  it.each([['Filters correctly', appointments]])('%s scheduledAppointments(%s, %s)', (_: string, a: Activity[]) => {
    expect(scheduledAppointments(a)[0]).toEqual(appointments[2])
  })
})
