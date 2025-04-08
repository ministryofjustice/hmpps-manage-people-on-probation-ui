import { Need } from '../data/arnsApiClient'
import { RiskFlag } from '../data/model/risk'
import { groupByLevel } from './groupByLevel'

describe('groupByLevel()', () => {
  it('should return an empty array if no data', () => {
    expect(groupByLevel('STANDARD', null)).toEqual([])
  })
  it('should return filtered needs', () => {
    const mockNeeds: Need[] = [
      {
        section: 'ACCOMMODATION',
        name: 'Accommodation',
        riskOfHarm: true,
        riskOfReoffending: true,
        severity: 'STANDARD',
      },
      {
        section: 'EDUCATION_TRAINING_AND_EMPLOYABILITY',
        name: 'Education, Training and Employability',
        riskOfHarm: true,
        riskOfReoffending: true,
        severity: 'STANDARD',
      },
      {
        section: 'RELATIONSHIPS',
        name: 'Relationships',
        riskOfHarm: true,
        riskOfReoffending: true,
        severity: 'SEVERE',
      },
    ]
    expect(groupByLevel('STANDARD', mockNeeds)).toEqual(mockNeeds.filter(need => need?.severity === 'STANDARD'))
  })
  it('should return filtered risk flags', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Restraining Order',
        notes: 'Some notes',
        createdDate: '2022-12-18',
        nextReviewDate: '2024-12-15',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        description: 'Domestic Abuse Perpetrator',
        level: 'MEDIUM',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 3,
        description: 'Risk to Known Adult',
        level: 'LOW',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 4,
        description: 'Domestic Abuse Perpetrator',
        level: 'INFORMATION_ONLY',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('MEDIUM', mockRiskFlags)).toEqual(mockRiskFlags.filter(riskFlag => riskFlag.level === 'MEDIUM'))
  })
})
