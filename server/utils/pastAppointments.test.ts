import { Activity } from '../data/model/schedule'
import { appointments } from './mocks'
import { pastAppointments } from './pastAppointments'

describe('utils/pastAppointments', () => {
  it.each([['Filters correctly', appointments]])('%s pastAppointments(%s, %s)', (_: string, a: Activity[]) => {
    expect(pastAppointments(a)[0]).toEqual(appointments[6])
  })
})
