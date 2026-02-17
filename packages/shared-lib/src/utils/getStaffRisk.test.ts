import { RiskFlag } from '../data/model/risk'
import { getStaffRisk } from './getStaffRisk'

describe('getStaffRisk()', () => {
  it('should return null if no data', () => {
    expect(getStaffRisk(null)).toEqual(null)
  })
  it('should return null if no "Risk to Staff" flags', () => {
    const mockRiskFlags = [
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
    ] as unknown as RiskFlag[]
    expect(getStaffRisk(mockRiskFlags)).toEqual(null)
  })

  it('should return null if "Risk to Staff" flag is not Medium or High levelDescription', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Risk to Staff',
        levelDescription: 'Low',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Jane', surname: 'Doe' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(getStaffRisk(mockRiskFlags)).toEqual(null)
  })

  it('should return "Risk to Staff" flag if levelDescription is valid (case-insensitive)', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Risk to Staff',
        levelDescription: 'medium',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Alice', surname: 'Brown' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        level: 'HIGH',
        description: 'Risk to Staff',
        levelDescription: 'HIGH',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Bob', surname: 'Green' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(getStaffRisk(mockRiskFlags)).toEqual(mockRiskFlags[0])
  })

  it('should return "Risk to Staff" flag if levelDescription is missing', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Risk to Staff',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Charlie', surname: 'White' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(getStaffRisk(mockRiskFlags)).toEqual(mockRiskFlags[0])
  })

  it('should return the single "Risk to Staff" flag if it exists', () => {
    const mockRiskFlags = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Risk to Staff',
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
    ] as unknown as RiskFlag[]
    expect(getStaffRisk(mockRiskFlags)).toEqual(
      mockRiskFlags.filter(riskFlag => riskFlag.description === 'Risk to Staff')[0],
    )
  })
})
