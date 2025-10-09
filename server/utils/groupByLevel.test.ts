import { Need, RiskFlag } from '../data/model/risk'
import { groupByLevel } from './groupByLevel'

describe('groupByLevel()', () => {
  it('should return an empty array if no data', () => {
    expect(groupByLevel('STANDARD', null)).toEqual([])
  })
  it('should return filtered needs by severity', () => {
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

  it('should return filtered risk flags by levelDescription (case-insensitive)', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'LOW',
        levelDescription: 'Medium',
        description: 'Risk to Known Adult',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        level: 'HIGH',
        levelDescription: 'HIGH',
        description: 'Risk to Staff',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Jane', surname: 'Doe' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('medium', mockRiskFlags)).toEqual([mockRiskFlags[0]])
    expect(groupByLevel('HIGH', mockRiskFlags)).toEqual([mockRiskFlags[1]])
  })

  it('should return filtered risk flags by level when levelDescription is missing (case-insensitive)', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Restraining Order',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        level: 'MEDIUM',
        description: 'Domestic Abuse Perpetrator',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Jane', surname: 'Doe' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('medium', mockRiskFlags)).toEqual([mockRiskFlags[1]])
    expect(groupByLevel('HIGH', mockRiskFlags)).toEqual([mockRiskFlags[0]])
  })

  it('should ignore items where level is undefined', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        description: 'Unknown risk level',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Sam', surname: 'Taylor' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        level: 'MEDIUM',
        description: 'Verified risk',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Alex', surname: 'Brown' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('medium', mockRiskFlags)).toEqual([mockRiskFlags[1]])
  })

  it('should return empty array if no matches found', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'LOW',
        description: 'Some other risk',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Alex', surname: 'Brown' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('HIGH', mockRiskFlags)).toEqual([])
  })
})
