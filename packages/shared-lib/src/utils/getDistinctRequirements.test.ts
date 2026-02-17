import { getDistinctRequirements } from './getDistinctRequirements'
import { appointments } from './mocks'

describe('utils/getDistinctRequirements', () => {
  it('should return an array of distinct requirements', () => {
    expect(getDistinctRequirements(appointments)).toStrictEqual(['Stepping Stones', 'Choices and Changes'])
  })
})
