import { getDataValue } from './getDataValue'

const mockSession = {
  appointments: {
    X000001: {
      1234: {
        type: 'Planned office visit',
        'repeating-count': '2',
        date: '2024-04-10',
      },
      4567: {
        type: '3 Way Meeting',
        'repeating-count': '3',
        date: '2024-03-11',
      },
    },
  },
}
describe('utils/getDataValue', () => {
  it('should return the correct value', () => {
    expect(getDataValue(mockSession, 'appointments')).toEqual(mockSession.appointments)
    expect(getDataValue(mockSession, ['appointments', 'X000001', 4567, 'type'])).toEqual('3 Way Meeting')
  })
})
