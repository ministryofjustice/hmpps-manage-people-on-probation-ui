import { RiskFlag } from '../data/model/risk'
import { getRiskRoshScore } from './getRiskRoshScore'

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
    id: 2500729791,
    description: 'Medium RoSH',
    level: 'MEDIUM',
    riskNotes: [],
    nextReviewDate: '2025-03-24',
    createdDate: '2024-09-24',
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
  it.each([null, undefined, [] as any])('should return null if no risk flags', value => {
    const score = getRiskRoshScore(value)
    expect(score).toBeNull()
  })
  it('should return the rosh score', () => {
    expect(getRiskRoshScore(mockRiskFlags)).toEqual('MEDIUM')
  })
})
