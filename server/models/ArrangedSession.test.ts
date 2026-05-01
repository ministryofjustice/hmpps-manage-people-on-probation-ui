import { ArrangedSession } from './ArrangedSession'
import { AppointmentSession } from './Appointments'

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
})
