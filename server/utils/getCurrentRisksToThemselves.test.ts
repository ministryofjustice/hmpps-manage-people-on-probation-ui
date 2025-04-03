import { RiskToSelf } from '../data/arnsApiClient'
import { getCurrentRisksToThemselves } from './getCurrentRisksToThemselves'
import * as getRisksToThemselves from './getRisksToThemselves'

const mockRisks = ['mocked risk']
jest.mock('./getRisksToThemselves', () => {
  return {
    ...jest.requireActual('./getRisksToThemselves'),
    getRisksToThemselves: jest.fn(() => mockRisks),
  }
})

const mockRiskToSelf = {
  suicide: {
    risk: 'YES',
    previous: 'DK',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
  },
  selfHarm: {
    risk: 'YES',
    previous: 'YES',
    previousConcernsText: 'Meaningful content for AssSumm Testing - r814 ',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
  },
  custody: {
    risk: 'YES',
    previous: 'DK',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing -  r821',
  },
  hostelSetting: {
    risk: 'YES',
    previous: 'YES',
    previousConcernsText: 'Meaningful content for AssSumm Testing -  R822',
    current: 'NO',
  },
  vulnerability: {
    risk: 'YES',
    previous: 'NO',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing -  r831',
  },
} as RiskToSelf

describe('getCurrentRisksToThemselves', () => {
  let spy: jest.SpyInstance
  let result: any
  beforeEach(() => {
    spy = jest.spyOn(getRisksToThemselves, 'getRisksToThemselves')
    result = getCurrentRisksToThemselves(mockRiskToSelf)
  })
  it('should get the risks', () => {
    expect(spy).toHaveBeenCalledWith(mockRiskToSelf, 'current')
  })
  it('should return the current risks', () => {
    expect(result).toStrictEqual(mockRisks)
  })
})
