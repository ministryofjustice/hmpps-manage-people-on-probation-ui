import { setDataValue } from './setDataValue'

const mockSession = {
  appointments: {
    X000001: {
      '1234': {
        type: 'C084',
        numberOfAppointments: '2',
        date: '2024-04-10',
      },
      '4567': {
        type: 'CHVS',
        numberOfAppointments: '3',
        date: '2024-03-11',
      },
    },
  },
}

describe('utils/setDataValue', () => {
  it('should set the value if argument path is a single property', () => {
    const data = mockSession
    const updatedValue = {
      X000002: {
        '1234': {
          ...mockSession.appointments.X000001['1234'],
        },
      },
    }
    setDataValue(data, 'appointments', updatedValue)
    expect(data.appointments).toEqual(updatedValue)
  })

  it('should set the value if argument path is multiple properties', () => {
    const data = mockSession
    const updatedValue = '2025-03-11'
    setDataValue(data, ['appointments', 'X000001', '4567', 'date'], updatedValue)
    expect(data.appointments.X000001['4567'].date).toEqual(updatedValue)
  })
})
