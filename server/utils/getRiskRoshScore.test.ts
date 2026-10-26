import { RiskFlag } from '../data/model/risk'
import { getRiskRoshScore } from './getRiskRoshScore'

const mockRoshFlag = ({ mostRecentReviewDate = '2025-05-18' } = {}): RiskFlag => ({
  id: 2500729791,
  description: 'Medium RoSH',
  level: 'MEDIUM',
  riskNotes: [],
  nextReviewDate: '2025-03-24',
  createdDate: '2024-09-24',
  createdBy: { forename: 'Assessment Summary', surname: 'Service' },
  removed: false,
  removalHistory: [],
  mostRecentReviewDate,
})

const mockRiskFlags: RiskFlag[] = [
  {
    id: 2500794874,
    description: 'Risk to Children',
    level: 'HIGH',
    riskNotes: [],
    nextReviewDate: '2026-09-09',
    mostRecentReviewDate: '2026-06-09',
    createdDate: '2025-03-04',
    createdBy: { forename: 'Assessment Summary', surname: 'Service' },
    removed: false,
    removalHistory: [],
  },
  {
    id: 2500794878,
    description: 'Risk to Staff',
    level: 'HIGH',
    riskNotes: [],
    nextReviewDate: '2026-12-09',
    mostRecentReviewDate: '2026-06-09',
    createdDate: '2025-03-04',
    createdBy: { forename: 'Assessment Summary', surname: 'Service' },
    removed: false,
    removalHistory: [],
  },
  {
    id: 2500794875,
    description: 'Risk to Known Adult',
    level: 'MEDIUM',
    nextReviewDate: '2026-12-09',
    mostRecentReviewDate: '2026-06-09',
    createdDate: '2025-03-04',
    createdBy: { forename: 'Assessment Summary', surname: 'Service' },
    removed: false,
    removalHistory: [],
  },
  {
    id: 2500794876,
    description: 'Risk to Prisoner',
    nextReviewDate: '2026-12-09',
    mostRecentReviewDate: '2026-06-09',
    createdDate: '2025-03-04',
    createdBy: { forename: 'Assessment Summary', surname: 'Service' },
    removed: false,
    removalHistory: [],
  },
  {
    id: 2500794877,
    description: 'Risk to Public',
    level: 'MEDIUM',
    nextReviewDate: '2026-12-09',
    mostRecentReviewDate: '2026-06-09',
    createdDate: '2025-03-04',
    createdBy: { forename: 'Assessment Summary', surname: 'Service' },
    removed: false,
    removalHistory: [],
  },
]

describe('utils/getRiskRoshScore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it.each([null, undefined, [] as RiskFlag[][]])('should return null values if no risk flags', value => {
    const result = getRiskRoshScore(value)
    expect(result).toStrictEqual({ score: null, assessedOn: null })
  })
  it('should return null values if no rosh risk flag', () => {
    expect(getRiskRoshScore(mockRiskFlags)).toStrictEqual({ score: null, assessedOn: null })
  })
  it('should return the rosh score and last assessment date', () => {
    const riskFlags: RiskFlag[] = [...mockRiskFlags, mockRoshFlag()]
    expect(getRiskRoshScore(riskFlags)).toStrictEqual({ score: 'MEDIUM', assessedOn: '2025-05-18' })
  })

  it('should return null for assessment date if review date is null', () => {
    const riskFlags: RiskFlag[] = [...mockRiskFlags, mockRoshFlag({ mostRecentReviewDate: null })]
    expect(getRiskRoshScore(riskFlags)).toStrictEqual({ score: 'MEDIUM', assessedOn: null })
  })
})
