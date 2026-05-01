import { getDataValue } from './getDataValue'

const mockSession = {
  appointments: {
    X000001: {
      1234: {
        type: 'C084',
        date: '2024-04-10',
      },
      4567: {
        type: 'CHVS',
        date: '2024-03-11',
      },
    },
  },
}
describe('utils/getDataValue', () => {
  it('should return the correct value', () => {
    expect(getDataValue(mockSession, 'appointments')).toEqual(mockSession.appointments)
    expect(getDataValue(mockSession, ['appointments', 'X000001', 4567, 'type'])).toEqual('CHVS')
  })
})
