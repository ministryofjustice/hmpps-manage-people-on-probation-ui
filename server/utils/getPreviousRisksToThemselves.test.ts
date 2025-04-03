import { RiskToSelf } from '../data/arnsApiClient'

import { getPreviousRisksToThemselves } from './getPreviousRisksToThemselves'
import * as getCurrentRisks from './getCurrentRisksToThemselves'
import * as getRisks from './getRisksToThemselves'

const mockCurrentRisks = ['suicide', 'self harm', 'custody', 'vulnerability']
const mockPreviousRisks = ['self harm', 'hostel setting']

jest.mock('./getCurrentRisksToThemselves', () => {
  return {
    ...jest.requireActual('./getCurrentRisksToThemselves'),
    getCurrentRisksToThemselves: jest.fn(() => mockCurrentRisks),
  }
})

jest.mock('./getRisksToThemselves', () => {
  return {
    ...jest.requireActual('./getRisksToThemselves'),
    getRisksToThemselves: jest.fn(() => mockPreviousRisks),
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

describe('getPreviousRisksToThemselves', () => {
  let getCurrentRisksSpy: jest.SpyInstance
  let getPreviousRisksSpy: jest.SpyInstance
  let result: any
  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    getCurrentRisksSpy = jest.spyOn(getCurrentRisks, 'getCurrentRisksToThemselves')
    getPreviousRisksSpy = jest.spyOn(getRisks, 'getRisksToThemselves')
    result = getPreviousRisksToThemselves(mockRiskToSelf)
  })
  it('should get the current risks', () => {
    expect(getCurrentRisksSpy).toHaveBeenCalledWith(mockRiskToSelf)
  })
  it('should get the previous risks', () => {
    expect(getPreviousRisksSpy).toHaveBeenCalledWith(mockRiskToSelf, 'previous')
  })
  it('should return the previous risks', () => {
    expect(result).toEqual(['hostel setting'])
  })
})
