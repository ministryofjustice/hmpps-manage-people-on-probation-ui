import { ArrangedSession } from './ArrangedSession'
import { Appointment } from '../@types'

describe('Arranged Session', () => {
  it('call the constructor with no params and set default params', () => {
    const arrangedSession = new ArrangedSession({})
    expect(arrangedSession.getDateString({})).toEqual('2021-03-25')
  })

  it('calls getDateString with date in params', () => {
    const arrangedSession = new ArrangedSession({ date: '2023-02-14' })
    expect(arrangedSession.getDateString({ date: '2023-02-14' })).toEqual('2023-02-14')
  })

  it('calls getDateString with year in params', () => {
    const arrangedSession = new ArrangedSession({})
    expect(arrangedSession.getDateString({ month: 5, day: 18, year: 2023 })).toEqual('2023-05-18')
  })

  it('calls static generateRepeatedAppointments with no repeats week', () => {
    const appointment: Appointment = {
      'end-time': '10:00am',
      'start-time': '11:00am',
      date: '2023-05-18',
      location: 'LOC',
      type: 'TYPE',
    }
    const repeated = ArrangedSession.generateRepeatedAppointments(appointment, 'week')
    expect(repeated.length).toEqual(0)
  })

  it('calls static generateRepeatedAppointments with repeating week', () => {
    const appointment: Appointment = {
      'end-time': '10:00am',
      'start-time': '11:00am',
      date: '2023-05-18',
      location: 'LOC',
      type: 'TYPE',
      repeating: 'Yes',
      'repeating-count': '1',
    }
    const repeated = ArrangedSession.generateRepeatedAppointments(appointment, undefined, 1)
    expect(repeated.length).toEqual(1)
    expect(repeated[0].date).toEqual('2023-05-25')
  })

  it('calls static generateRepeatedAppointments with repeating every 2 months', () => {
    const appointment: Appointment = {
      'end-time': '10:00am',
      'start-time': '11:00am',
      date: '2023-05-18',
      location: 'LOC',
      type: 'TYPE',
      repeating: 'Yes',
      'repeating-count': '2',
    }
    const repeated = ArrangedSession.generateRepeatedAppointments(appointment, 'month', 2)
    expect(repeated.length).toEqual(2)
    expect(repeated[1].date).toEqual('2023-08-18')
  })
})
