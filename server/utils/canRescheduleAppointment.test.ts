import { PersonAppointment } from '../data/model/schedule'
import { canRescheduleAppointment } from './canRescheduleAppointment'
import { isInThePast } from './isInThePast'

jest.mock('./isInThePast', () => ({
  isInThePast: jest.fn(),
}))

const getMockPersonAppointment = ({
  hasOutcome = false,
  startDateTime = '2024-02-21T10:15:00.382936Z[Europe/London]',
} = {}): PersonAppointment => {
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
      startDateTime,
      hasOutcome,
    },
  }
  return mock
}

const mockedIsInThePast = isInThePast as jest.MockedFunction<typeof isInThePast>

describe('utils/canRescheduleAppointment', () => {
  it('should return false if appointment does not have a start date and time', () => {
    const mockPersonAppointment = getMockPersonAppointment({ startDateTime: '' })
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(false)
  })
  it('should return true if appointment is in past and no outcome recorded', () => {
    mockedIsInThePast.mockReturnValueOnce(true)
    const mockPersonAppointment = getMockPersonAppointment()
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(true)
  })
  it('should return true if appointment is in future and no outcome recorded', () => {
    mockedIsInThePast.mockReturnValueOnce(false)
    const mockPersonAppointment = getMockPersonAppointment()
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(true)
  })
  it('should return false if appointment is in past and outcome recorded', () => {
    mockedIsInThePast.mockReturnValueOnce(true)
    const mockPersonAppointment = getMockPersonAppointment({ hasOutcome: true })
    expect(canRescheduleAppointment(mockPersonAppointment)).toEqual(false)
  })
})
