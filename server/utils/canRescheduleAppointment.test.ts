import { PersonAppointment } from '../data/model/schedule'
import { canRescheduleAppointment } from './canRescheduleAppointment'

const getMockPersonAppointment = ({ hasOutcome = false, deliusManaged = false } = {}): PersonAppointment => {
  const mock: PersonAppointment = {
    personSummary: {
      name: {
        forename: '',
        surname: '',
      },
      crn: '',
      dateOfBirth: '',
    },
    appointment: {
      id: '1234',
      type: 'Appointment type',
      startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
      hasOutcome,
      deliusManaged,
    },
  }
  return mock
}

describe('utils/canRescheduleAppointment', () => {
  it('should return false if appointment is Delius managed', () => {
    const mockPersonAppointment = getMockPersonAppointment({ deliusManaged: true })
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(false)
  })
  it('should return false if appointment has an outcome', () => {
    const mockPersonAppointment = getMockPersonAppointment({ hasOutcome: true })
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(false)
  })
  it('should return true if appointment has no outcome recorded', () => {
    const mockPersonAppointment = getMockPersonAppointment()
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(true)
  })
})
