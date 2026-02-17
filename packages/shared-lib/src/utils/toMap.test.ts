import { toMap } from './toMap'

const mockRisk = {
  LOW: ['Children'],
  MEDIUM: ['Known Adult'],
  HIGH: ['Public'],
  VERY_HIGH: ['Staff'],
}

const expected = {
  Children: 'LOW',
  'Known Adult': 'MEDIUM',
  Public: 'HIGH',
  Staff: 'VERY_HIGH',
}

describe('utils/toMap', () => {
  it('should return a mapped risk object', () => {
    expect(toMap(mockRisk)).toEqual(expected)
  })
})
