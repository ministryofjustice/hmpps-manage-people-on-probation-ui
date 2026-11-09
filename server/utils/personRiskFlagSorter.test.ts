import { RiskFlag } from '../data/model/risk'
import { getRiskBadgeGroups } from './personRiskFlagSorter'

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

  const getBadges = (riskFlags: ReturnType<typeof createRiskFlag>[]) =>
    getRiskBadgeGroups(riskFlags).groups.flatMap(group => group.badges)

  describe('filters removed risk flags', () => {
    it('does not include removed risk flags', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Alert Notice',
          level: 'MEDIUM',
          removed: true,
        }),
      ])

      expect(result).toEqual({
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
    it('sorts Public Protection risk flags by severity, then alphabetically', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          levelDescription: 'LOW',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Known Adult',
          levelDescription: 'MEDIUM',
        }),
        createRiskFlag({
          id: 3,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups.map(group => group.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW'])

      expect(result.groups.flatMap(group => group.badges.map(badge => badge.id))).toEqual([3, 2, 1])
    })

    it('uses levelDescription for Public Protection and level for other risks', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Risk to Staff',
          level: 'LOW',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Child Concerns',
          level: 'MEDIUM',
          levelDescription: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups.map(group => group.severity)).toEqual(['HIGH', 'MEDIUM'])

      expect(result.groups.flatMap(group => group.badges)).toEqual([
        {
          id: 1,
          text: 'Risk to staff - High',
          level: 'HIGH',
          badgeClass: 'risk-badge--high',
        },
        {
          id: 2,
          text: 'Child concerns',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
      ])
    })

    it('sorts by register priority and alphabetically within each register', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Weapons',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Known Adult',
          level: 'LOW',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Alert Notice',
          level: 'HIGH',
        }),
      ]

      const result = getRiskBadgeGroups(riskFlags)

      expect(result.groups.map(group => group.severity)).toEqual(['HIGH', 'HIGH', 'HIGH'])

      expect(result.groups.flatMap(group => group.badges.map(badge => badge.text))).toEqual([
        'Risk to known adult - High',
        'Alert notice',
        'Weapons',
      ])
    })

    it('sorts special risks before Public Protection and other register types', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Weapons',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 2,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Risk to Staff',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 4,
          description: 'Risk to Probation Staff',
          level: 'HIGH',
        }),
      ]

      expect(getBadges(riskFlags).map(badge => badge.text)).toEqual([
        'Risk to probation staff',
        'Risk to staff - High',
        'Risk to public - High',
        'Weapons',
      ])
    })

    it('sorts remaining registers as Safeguarding Risk, Alerts, Safeguarding Need, then Cohort', () => {
      const riskFlags = [
        createRiskFlag({
          id: 1,
          description: 'Cuckooing - Potential Victim',
          level: 'MEDIUM',
        }),
        createRiskFlag({
          id: 2,
          description: 'Weapons',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 3,
          description: 'Child Concerns',
          level: 'MEDIUM',
        }),
        createRiskFlag({
          id: 4,
          description: 'Alert Notice',
          level: 'HIGH',
        }),
        createRiskFlag({
          id: 5,
          description: 'Lifer',
          levelDescription: 'Lifer - Supervised',
        }),
      ]

      expect(getBadges(riskFlags).map(badge => badge.text)).toEqual([
        'Child concerns',
        'Alert notice',
        'Weapons',
        'Cuckooing - potential victim',
        'Lifer - supervised',
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

      expect(result.groups.flatMap(group => group.badges)).toEqual([
        {
          id: 2,
          text: 'Risk to probation staff',
          level: 'HIGH',
          badgeClass: 'risk-badge--high',
        },
        {
          id: 1,
          text: 'Risk to public - High',
          level: 'HIGH',
          badgeClass: 'risk-badge--high',
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

      expect(result.groups.flatMap(group => group.badges)[0]).toEqual({
        id: 1,
        text: 'Child concerns',
        level: 'MEDIUM',
        badgeClass: 'risk-badge--medium',
      })
    })

    it('displays the MAPPA level from levelDescription', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'MAPPA',
          level: 'LOW',
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

  describe('preserves sorted badge order across groups', () => {
    it('creates a separate group for each badge while preserving sorted order', () => {
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
              id: 2,
              text: 'Risk to probation staff',
              level: 'HIGH',
              badgeClass: 'risk-badge--high',
            },
          ],
        },
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

    it('preserves the severity order of Public Protection badges', () => {
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

      expect(getRiskBadgeGroups(riskFlags).remainingCount).toBe(3)
    })

    it('returns zero remaining count when there are 7 or fewer risk flags', () => {
      const riskFlags = Array.from({ length: 7 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      expect(getRiskBadgeGroups(riskFlags).remainingCount).toBe(0)
    })
  })

  describe('handles missing risk level', () => {
    it('ignores Public Protection flags when levelDescription and level are missing', () => {
      const result = getRiskBadgeGroups([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          level: undefined,
          levelDescription: undefined,
        }),
      ])

      expect(result.groups).toEqual([])
      expect(result.remainingCount).toBe(0)
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
    it('ignores unsupported descriptions', () => {
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

      expect(getBadges(riskFlags).map(badge => badge.text)).toEqual(['Risk to public - High'])
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
            ],
          },
          {
            severity: 'MEDIUM',
            badges: [
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

  it('ignores risk flags with descriptions that are not in the supported register types', () => {
    const riskFlags = [
      {
        id: 1,
        description: 'Risk to Public',
        removed: false,
        levelDescription: 'High',
      },
      {
        id: 2,
        description: 'Some unsupported risk',
        removed: false,
        levelDescription: 'High',
      },
      {
        id: 3,
        description: 'Risk to Children',
        removed: false,
        levelDescription: 'Medium',
      },
    ] as RiskFlag[]

    const result = getRiskBadgeGroups(riskFlags)

    const badgeIds = result.groups.flatMap(group => group.badges.map(badge => badge.id))

    expect(badgeIds).toEqual([1, 3])
    expect(result.remainingCount).toBe(0)
  })

  describe('Lifer risk badges', () => {
    const createLiferRiskFlag = (levelDescription?: string): RiskFlag =>
      ({
        id: 2501027491,
        description: 'Lifer',
        levelCode: levelDescription === 'Lifer - Supervised' ? 'L1' : 'L2',
        levelDescription,
        riskNotes: [],
        createdDate: '2026-10-19',
        createdBy: {
          forename: 'A',
          surname: 'B',
        },
        removed: false,
        removalHistory: [],
      }) as RiskFlag

    it.each([
      ['Lifer - Supervised', 'Lifer - supervised'],
      ['Lifer - Not Supervised', 'Lifer - not supervised'],
    ])('displays "%s" as "%s"', (levelDescription, expectedText) => {
      const result = getRiskBadgeGroups([createLiferRiskFlag(levelDescription)])

      expect(result.remainingCount).toBe(0)
      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].badges).toHaveLength(1)
      expect(result.groups[0].badges[0]).toEqual(
        expect.objectContaining({
          id: 2501027491,
          text: expectedText,
          level: 'LOW',
          badgeClass: 'risk-badge--cohort',
        }),
      )
    })

    it('falls back to Lifer when levelDescription is missing', () => {
      const result = getRiskBadgeGroups([createLiferRiskFlag(undefined)])

      expect(result.groups.flatMap(group => group.badges)).toContainEqual(
        expect.objectContaining({
          text: 'Lifer',
          level: 'LOW',
          badgeClass: 'risk-badge--cohort',
        }),
      )
    })

    it('does not display a removed Lifer flag', () => {
      const result = getRiskBadgeGroups([
        {
          ...createLiferRiskFlag('Lifer - Supervised'),
          removed: true,
        },
      ])

      expect(result.groups).toEqual([])
      expect(result.remainingCount).toBe(0)
    })
  })

  it('formats DORIS with its display override', () => {
    const result = getRiskBadgeGroups([
      createRiskFlag({
        id: 1,
        description: 'DoRIS (Disruption of Recorded Internal Secretors)',
        level: 'MEDIUM',
      }),
    ])

    expect(result.groups.flatMap(group => group.badges)).toEqual([
      {
        id: 1,
        text: 'DORIS (disruption of recorded internal secretors)',
        level: 'MEDIUM',
        badgeClass: 'risk-badge--medium',
      },
    ])
  })

  describe('Home Office Interest cohort risk badges', () => {
    const createHomeOfficeInterestRiskFlag = (): RiskFlag =>
      ({
        id: 2501027492,
        description: 'Home Office Interest',
        levelCode: 'HOI',
        levelDescription: 'Home Office Interest',
        riskNotes: [],
        createdDate: '2026-10-19',
        createdBy: {
          forename: 'A',
          surname: 'B',
        },
        removed: false,
        removalHistory: [],
      }) as RiskFlag

    it('displays Home Office Interest as a cohort badge', () => {
      const result = getRiskBadgeGroups([createHomeOfficeInterestRiskFlag()])

      expect(result.remainingCount).toBe(0)
      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].badges).toHaveLength(1)

      expect(result.groups[0].badges[0]).toEqual(
        expect.objectContaining({
          id: 2501027492,
          text: 'Home office interest',
          level: 'LOW',
          badgeClass: 'risk-badge--cohort',
        }),
      )
    })
  })
})
