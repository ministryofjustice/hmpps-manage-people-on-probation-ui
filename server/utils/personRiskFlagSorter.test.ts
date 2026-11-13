import { RiskFlag } from '../data/model/risk'
import { getRiskBadges } from './personRiskFlagSorter'

describe('utils/getRiskBadges', () => {
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
      const result = getRiskBadges([
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
        groupedBadges: [
          {
            severity: 'HIGH',
            title: 'High',
            className: 'risk-badge--high',
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
        headerBadges: [
          {
            id: 1,
            text: 'Risk to public - High',
            level: 'HIGH',
            badgeClass: 'risk-badge--high',
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
        createRiskFlag({
          id: 4,
          description: 'Risk to Public',
          levelDescription: 'MEDIUM',
        }),
      ]

      const result = getRiskBadges(riskFlags)

      expect(result.headerBadges.map(b => b.level)).toEqual(['HIGH', 'MEDIUM', 'MEDIUM', 'LOW'])
      expect(result.headerBadges.map(b => b.id)).toEqual([3, 2, 4, 1])

      expect(result.groupedBadges.map(g => g.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW'])
      expect(result.groupedBadges[1].badges.map(b => b.id)).toEqual([2, 4])
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

      const result = getRiskBadges(riskFlags)
      const expectedBadges = [
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
      ]

      expect(result.groupedBadges.map(g => g.severity)).toEqual(['HIGH', 'MEDIUM'])
      expect(result.groupedBadges.flatMap(group => group.badges)).toEqual(expectedBadges)

      expect(result.headerBadges).toEqual(expectedBadges)
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

      const result = getRiskBadges(riskFlags)
      const expectedTitles = ['Risk to known adult - High', 'Alert notice', 'Weapons']

      expect(result.groupedBadges).toHaveLength(1)
      expect(result.groupedBadges[0].severity).toEqual('HIGH')
      expect(result.groupedBadges[0].badges.map(badge => badge.text)).toEqual(expectedTitles)

      expect(result.headerBadges.map(badge => badge.text)).toEqual(expectedTitles)
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

      const result = getRiskBadges(riskFlags)
      const expectedTitles = ['Risk to probation staff', 'Risk to staff - High', 'Risk to public - High', 'Weapons']

      expect(result.groupedBadges).toHaveLength(1)
      expect(result.groupedBadges[0].severity).toEqual('HIGH')
      expect(result.groupedBadges[0].badges.map(badge => badge.text)).toEqual(expectedTitles)

      expect(result.headerBadges.map(badge => badge.text)).toEqual(expectedTitles)
    })

    it('sorts remaining registers as Safeguarding Risk, Alerts, Safeguarding Need, then Cohort, and sorts groups by severity', () => {
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

      const result = getRiskBadges(riskFlags)
      const expectedTitles = [
        'Child concerns',
        'Alert notice',
        'Weapons',
        'Cuckooing - potential victim',
        'Lifer - supervised',
      ]

      expect(result.headerBadges.map(badge => badge.text)).toEqual(expectedTitles)
      expect(
        result.groupedBadges.map(group => ({ severity: group.severity, titles: group.badges.map(b => b.text) })),
      ).toEqual([
        { severity: 'HIGH', titles: ['Alert notice', 'Weapons'] },
        { severity: 'MEDIUM', titles: ['Child concerns', 'Cuckooing - potential victim'] },
        { severity: 'COHORT', titles: ['Lifer - supervised'] },
      ])
    })

    it('sorts groups by severity, then cohort, then miscellaneous, leaving badges order within groups', () => {
      const riskFlags = [
        // Group: Medium
        createRiskFlag({ level: 'MEDIUM', description: 'Child Concerns' }),
        createRiskFlag({ levelDescription: 'MEDIUM', description: 'Risk to Public' }),
        // Group: Low
        createRiskFlag({ level: 'LOW', description: 'Domestic Abuse Safety Officer' }),
        createRiskFlag({ level: 'LOW', description: 'County Lines - Victim' }),
        // Group: Miscellaneous
        createRiskFlag({ level: 'LOW', description: 'CPPC registered case' }),
        createRiskFlag({ level: 'LOW', description: 'integrated offender management' }),
        // Group: Cohort
        createRiskFlag({ level: undefined, description: 'Street Gangs' }),
        createRiskFlag({ level: undefined, description: 'Home Office Interest' }),
        createRiskFlag({ level: undefined, description: 'Cyber - Dependent' }),
        // Group: High
        createRiskFlag({ level: 'HIGH', description: 'Domestic Abuse' }),
        createRiskFlag({ level: 'HIGH', description: 'MAPPA' }),
        createRiskFlag({ level: 'HIGH', description: 'Child Protection' }),
      ]

      const result = getRiskBadges(riskFlags)

      expect(result.groupedBadges.map(({ title, badges }) => ({ title, badges: badges.map(b => b.text) }))).toEqual([
        { title: 'High', badges: ['Domestic abuse', 'MAPPA - HIGH', 'Child protection'] },
        { title: 'Medium', badges: ['Risk to public - Medium', 'Child concerns'] },
        { title: 'Low', badges: ['Domestic abuse safety officer', 'County lines - victim'] },
        { title: 'Cohort', badges: ['Cyber - dependent', 'Home office interest', 'Street gangs'] },
        { title: 'Miscellaneous', badges: ['CPPC registered case', 'Integrated offender management'] },
      ])
    })
  })

  describe('formats badge text', () => {
    it('uses levelDescription for Public Protection risk flags', () => {
      const result = getRiskBadges([
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
      const expectedBadges = [
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
      ]

      expect(result.groupedBadges.flatMap(group => group.badges)).toEqual(expectedBadges)
      expect(result.headerBadges).toEqual(expectedBadges)
    })

    it('uses level and not levelDescription for non-Public Protection risk flags', () => {
      const result = getRiskBadges([
        createRiskFlag({
          id: 1,
          description: 'Child Concerns',
          level: 'MEDIUM',
          levelDescription: 'HIGH',
        }),
      ])

      const expectedBadge = {
        id: 1,
        text: 'Child concerns',
        level: 'MEDIUM',
        badgeClass: 'risk-badge--medium',
      }

      expect(result.groupedBadges[0].badges[0]).toEqual(expectedBadge)
      expect(result.headerBadges[0]).toEqual(expectedBadge)
    })

    it('displays the MAPPA level from levelDescription', () => {
      const result = getRiskBadges([
        createRiskFlag({
          id: 1,
          description: 'MAPPA',
          level: 'LOW',
          levelDescription: 'MAPPA Level 3',
        }),
      ])

      const expectedBadge = {
        id: 1,
        text: 'MAPPA - Level 3',
        level: 'HIGH',
        badgeClass: 'risk-badge--high',
      }

      expect(result.groupedBadges).toEqual([
        {
          severity: 'HIGH',
          title: 'High',
          className: 'risk-badge--high',
          badges: [expectedBadge],
        },
      ])
      expect(result.headerBadges).toEqual([expectedBadge])
    })
  })

  describe('preserves sorted badge order across groups', () => {
    it('creates a separate group for each severity while preserving sorted order', () => {
      const result = getRiskBadges([
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

      expect(result.groupedBadges).toEqual([
        {
          severity: 'HIGH',
          title: 'High',
          className: 'risk-badge--high',
          badges: [
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
          ],
        },
        {
          severity: 'MEDIUM',
          title: 'Medium',
          className: 'risk-badge--medium',
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
      const result = getRiskBadges([
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

      const expectedOrder = ['HIGH', 'MEDIUM', 'LOW']

      expect(result.groupedBadges.map(g => g.severity)).toEqual(expectedOrder)
      expect(result.headerBadges.map(b => b.level)).toEqual(expectedOrder)
    })
  })

  describe('limits visible risk badges', () => {
    it('returns a maximum of 7 header badges', () => {
      const riskFlags = Array.from({ length: 8 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      const result = getRiskBadges(riskFlags)

      expect(result.groupedBadges.flatMap(group => group.badges)).toHaveLength(8)
      expect(result.headerBadges).toHaveLength(7)
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

      expect(getRiskBadges(riskFlags).remainingCount).toBe(3)
    })

    it('returns zero remaining count when there are 7 or fewer risk flags', () => {
      const riskFlags = Array.from({ length: 7 }, (_, index) =>
        createRiskFlag({
          id: index + 1,
          description: 'Risk to Public',
          levelDescription: 'HIGH',
        }),
      )

      expect(getRiskBadges(riskFlags).remainingCount).toBe(0)
    })
  })

  describe('handles missing risk level', () => {
    it('ignores Public Protection flags when levelDescription and level are missing', () => {
      const result = getRiskBadges([
        createRiskFlag({
          id: 1,
          description: 'Risk to Public',
          level: undefined,
          levelDescription: undefined,
        }),
      ])

      expect(result.groupedBadges).toEqual([])
      expect(result.headerBadges).toEqual([])
      expect(result.remainingCount).toBe(0)
    })
  })

  describe('handles empty input', () => {
    it('returns no groups and no remaining risk flags', () => {
      expect(getRiskBadges([])).toEqual({
        groupedBadges: [],
        headerBadges: [],
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

      const result = getRiskBadges(riskFlags)
      const expectedTitles = ['Risk to public - High']

      expect(result.groupedBadges.flatMap(group => group.badges.map(badge => badge.text))).toEqual(expectedTitles)
      expect(result.headerBadges.map(badge => badge.text)).toEqual(expectedTitles)
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

      expect(getRiskBadges(riskFlags)).toEqual({
        groupedBadges: [
          {
            severity: 'HIGH',
            title: 'High',
            className: 'risk-badge--high',
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
            title: 'Medium',
            className: 'risk-badge--medium',
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
        headerBadges: [
          {
            id: 2501007540,
            text: 'Risk to probation staff',
            level: 'HIGH',
            badgeClass: 'risk-badge--high',
          },
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

    const result = getRiskBadges(riskFlags)
    const expectedBadgeIds = [1, 3]

    expect(result.groupedBadges.flatMap(group => group.badges.map(badge => badge.id))).toEqual(expectedBadgeIds)
    expect(result.headerBadges.map(badge => badge.id)).toEqual(expectedBadgeIds)
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
      const result = getRiskBadges([createLiferRiskFlag(levelDescription)])
      const expectedBadge = {
        id: 2501027491,
        text: expectedText,
        level: 'LOW',
        badgeClass: 'risk-badge--cohort',
      }

      expect(result.remainingCount).toBe(0)
      expect(result.groupedBadges).toHaveLength(1)
      expect(result.groupedBadges[0].badges).toHaveLength(1)
      expect(result.groupedBadges[0].badges[0]).toEqual(expectedBadge)
      expect(result.headerBadges[0]).toEqual(expectedBadge)
    })

    it('falls back to Lifer when levelDescription is missing', () => {
      const result = getRiskBadges([createLiferRiskFlag(undefined)])
      const expectedBadgeData = {
        text: 'Lifer',
        level: 'LOW',
        badgeClass: 'risk-badge--cohort',
      }

      expect(result.groupedBadges[0].badges).toContainEqual(expect.objectContaining(expectedBadgeData))
      expect(result.headerBadges[0]).toEqual(expect.objectContaining(expectedBadgeData))
    })

    it('does not display a removed Lifer flag', () => {
      const result = getRiskBadges([
        {
          ...createLiferRiskFlag('Lifer - Supervised'),
          removed: true,
        },
      ])

      expect(result.groupedBadges).toEqual([])
      expect(result.headerBadges).toEqual([])
      expect(result.remainingCount).toBe(0)
    })
  })

  it('formats DORIS with its display override', () => {
    const result = getRiskBadges([
      createRiskFlag({
        id: 1,
        description: 'DoRIS (Disruption of Recorded Internal Secretors)',
        level: 'MEDIUM',
      }),
    ])

    const expectedBadgeData = {
      id: 1,
      text: 'DORIS (Disruption of recorded internal secretors)',
      level: 'MEDIUM',
      badgeClass: 'risk-badge--medium',
    }

    expect(result.groupedBadges[0].badges).toContainEqual(expect.objectContaining(expectedBadgeData))
    expect(result.headerBadges[0]).toEqual(expect.objectContaining(expectedBadgeData))
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
      const result = getRiskBadges([createHomeOfficeInterestRiskFlag()])

      const expectedBadgeData = {
        id: 2501027492,
        text: 'Home office interest',
        level: 'LOW',
        badgeClass: 'risk-badge--cohort',
      }

      expect(result.remainingCount).toBe(0)

      expect(result.groupedBadges[0].badges).toContainEqual(expect.objectContaining(expectedBadgeData))
      expect(result.headerBadges[0]).toEqual(expect.objectContaining(expectedBadgeData))
    })
  })
})
