import { RiskFlag } from '../data/model/risk'
import { getRiskBadgeGroups } from './personRiskFlagSorter'
import logger from '../../logger'

describe('utils/getRiskBadgeGroups', () => {
  const createRiskFlag = (overrides: Partial<RiskFlag> = {}): RiskFlag =>
    ({
      id: 1,
      description: 'Risk to Public',
      level: 'HIGH',
      levelDescription: 'HIGH',
      removed: false,
      ...overrides,
    }) as RiskFlag

  describe('filters removed risk flags', () => {
    it('does not include removed risk flags', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
          removed: false,
        }),
        createRiskFlag({
          id: 2,
          description: 'Alert Notice',
          level: 'MEDIUM',
          removed: true,
        }),
      ]

      expect(getRiskBadgeGroups(riskFlags)).toEqual({
        groups: [
          {
            severity: 'HIGH',
            badges: [
              {
                id: 1,
                text: 'Risk to public - High',
                level: 'HIGH',
                badgeClass: 'risk-badge--high',
              },
            ],
          },
        ],
        remainingCount: 0,
      })
    })
  })

  describe('sorts risk flags', () => {
    it('sorts Public Protection risk flags by levelDescription', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          levelDescription: 'LOW',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Public',
          levelDescription: 'MEDIUM',
        }),
        createRiskFlag({
          id: 3,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups).toEqual([
        {
          severity: 'HIGH',
          badges: [
            {
              id: 3,
              text: 'Risk to public - High',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
          ],
        },
        {
          severity: 'MEDIUM',
          badges: [
            {
              id: 2,
              text: 'Risk to public - Medium',
              level: 'MEDIUM',
              badgeClass: 'risk-badge--medium',
            },
          ],
        },
        {
          severity: 'LOW',
          badges: [
            {
              id: 1,
              text: 'Risk to public - Low',
              level: 'LOW',
              badgeClass: 'risk-badge--low',
            },
          ],
        },
      ])
    })

    it('uses level for non-Public Protection risk flags', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Child Concerns',
          level: 'LOW',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Alert Notice',
          level: 'MEDIUM',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Domestic Abuse Perpetrator',
          level: 'HIGH',
          levelDescription: 'LOW',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups.map(group => group.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW'])
    })

    it('sorts by register description when severity is the same', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Weapons',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Known Adult',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Alert Notice',
          level: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups).toHaveLength(1)

      expect(result.groups[0].badges.map(badge => badge.text)).toEqual([
        'Weapons',
        'Risk to known adult - High',
        'Alert notice',
      ])
    })
  })

  describe('formats badge text', () => {
    it('uses levelDescription for Public Protection risk flags', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          level: 'LOW',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Probation Staff',
          level: 'HIGH',
        }),
      ])

      expect(result.groups).toEqual([
        {
          severity: 'HIGH',
          badges: [
            {
              id: 1,
              text: 'Risk to public - High',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
            {
              id: 2,
              text: 'Risk to probation staff',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
          ],
        },
      ])
    })

    it('uses level and not levelDescription for non-Public Protection risk flags', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Child Concerns',
          level: 'MEDIUM',
          levelDescription: 'HIGH',
        }),
      ])

      expect(result.groups[0].badges[0]).toEqual({
        id: 1,
        text: 'Child concerns',
        level: 'MEDIUM',
        badgeClass: 'risk-badge--medium',
      })
    })
  })

  describe('groups risk flags by severity', () => {
    it('puts badges with the same severity into the same group', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          level: 'LOW',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Probation Staff',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Child Concerns',
          level: 'MEDIUM',
        }),
      ])

      expect(result.groups).toEqual([
        {
          severity: 'HIGH',
          badges: [
            {
              id: 1,
              text: 'Risk to public - High',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
            {
              id: 2,
              text: 'Risk to probation staff',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
          ],
        },
        {
          severity: 'MEDIUM',
          badges: [
            {
              id: 3,
              text: 'Child concerns',
              level: 'MEDIUM',
              badgeClass: 'risk-badge--medium',
            },
          ],
        },
      ])
    })

    it('creates separate groups for each severity', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          levelDescription: 'LOW',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Public',
          levelDescription: 'MEDIUM',
        }),
        createRiskFlag({
          id: 3,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      ])

      expect(result.groups.map(group => group.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW'])
    })
  })

  describe('limits visible risk badges', () => {
    it('returns a maximum of 7 badges', () => {
      const riskFlags = Array.from({ length: 8 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      const result = getRiskBadgeGroups(riskFlags)

      const totalBadges = result.groups.reduce((count, group) => count + group.badges.length, 0)

      expect(totalBadges).toBe(7)
      expect(result.remainingCount).toBe(1)
    })

    it('returns the correct remaining count when there are more than 7 risk flags', () => {
      const riskFlags = Array.from({ length: 10 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.remainingCount).toBe(3)
    })

    it('returns zero remaining count when there are 7 or fewer risk flags', () => {
      const riskFlags = Array.from({ length: 7 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('handles missing risk level', () => {
    it('defaults Public Protection severity to LOW when levelDescription is missing', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          level: undefined,
          levelDescription: undefined,
        }),
      ])

      expect(result.groups).toEqual([
        {
          severity: 'LOW',
          badges: [
            {
              id: 1,
              text: 'Risk to public - Low',
              level: 'LOW',
              badgeClass: 'risk-badge--low',
            },
          ],
        },
      ])
    })
  })

  describe('handles empty input', () => {
    it('returns no groups and no remaining risk flags', () => {
      expect(getRiskBadgeGroups([])).toEqual({
        groups: [],
        remainingCount: 0,
      })
    })
  })

  describe('handles unexpected descriptions', () => {
    it('places an unexpected description after known descriptions with the same severity', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Some Unexpected Risk',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups[0].badges.map(badge => badge.text)).toEqual([
        'Risk to public - High',
        'Some unexpected risk',
      ])
    })
  })

  describe('sample risk flag response', () => {
    it('returns the expected badges for the sample data', () => {
      const riskFlags = [
        createRiskFlag({
          id: 2501007540,
          description: 'Risk to Probation Staff',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 2501007047,
          description: 'Child Concerns',
          level: 'MEDIUM',
        }),
        createRiskFlag({
          id: 2501006590,
          description: 'Risk to Public',
          level: 'LOW',
          levelDescription: 'MEDIUM',
        }),
      ]

      expect(getRiskBadgeGroups(riskFlags)).toEqual({
        groups: [
          {
            severity: 'HIGH',
            badges: [
              {
                id: 2501007540,
                text: 'Risk to probation staff',
                level: 'HIGH',
                badgeClass: 'risk-badge--high',
              },
            ],
          },
          {
            severity: 'MEDIUM',
            badges: [
              {
                id: 2501006590,
                text: 'Risk to public - Medium',
                level: 'MEDIUM',
                badgeClass: 'risk-badge--medium',
              },
              {
                id: 2501007047,
                text: 'Child concerns',
                level: 'MEDIUM',
                badgeClass: 'risk-badge--medium',
              },
            ],
          },
        ],
        remainingCount: 0,
      })
    })
  })

  it('displays the MAPPA level from levelDescription', () => {
    const result = getRiskBadgeGroups([
      createRiskFlag({
        id: 1,
        description: 'MAPPA',
        level: 'HIGH',
        levelDescription: 'MAPPA Level 3',
      }),
    ])

    expect(result.groups).toEqual([
      {
        severity: 'HIGH',
        badges: [
          {
            id: 1,
            text: 'MAPPA - Level 3',
            level: 'HIGH',
            badgeClass: 'risk-badge--high',
          },
        ],
      },
    ])
  })
})
