import { getCurrentRisksToThemselves } from './getCurrentRisksToThemselves'
import * as getRisksToThemselves from './getRisksToThemselves'
import { riskToSelf } from './mocks'

const mockRisks = ['mocked risk']
jest.mock('./getRisksToThemselves', () => {
  return {
    ...jest.requireActual('./getRisksToThemselves'),
    getRisksToThemselves: jest.fn(() => mockRisks),
  }
})

describe('utils/getCurrentRisksToThemselves', () => {
  let spy: jest.SpyInstance
  let result: any
  beforeEach(() => {
    spy = jest.spyOn(getRisksToThemselves, 'getRisksToThemselves')
    result = getCurrentRisksToThemselves(riskToSelf)
  })
  it('should get the risks', () => {
    expect(spy).toHaveBeenCalledWith(riskToSelf, 'current')
  })
  it('should return the current risks', () => {
    expect(result).toStrictEqual(mockRisks)
  })
})
