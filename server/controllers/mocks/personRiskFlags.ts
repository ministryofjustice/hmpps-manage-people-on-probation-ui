import { PersonRiskFlags } from '../../data/model/risk'

export const mockPersonRiskFlags = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X777916',
    dateOfBirth: '1979-08-18',
  },
  opd: {
    eligible: true,
    date: '2024-12-12',
  },
  mappa: {
    level: 2,
    levelDescription: 'M2 Desc',
    category: 0,
    categoryDescription: 'X9 Desc',
    startDate: '2024-12-12',
    reviewDate: '2024-12-13',
  },
  riskFlags: [
    {
      id: 1,
      level: 'HIGH',
      description: 'Restraining Order',
      notes: 'Some notes',
      createdDate: '2022-12-18',
      nextReviewDate: '2024-12-15',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: false,
    },
    {
      id: 2,
      description: 'Domestic Abuse Perpetrator',
      level: 'MEDIUM',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: false,
    },
    {
      id: 3,
      description: 'Risk to Known Adult',
      level: 'LOW',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: false,
    },
    {
      id: 4,
      description: 'Domestic Abuse Perpetrator',
      level: 'INFORMATION_ONLY',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: false,
    },
  ],
  removedRiskFlags: [
    {
      id: 4,
      description: 'Restraining Order',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: true,
      removalHistory: [
        {
          notes: 'Some removal notes',
          removalDate: '2022-11-18',
          removedBy: {
            forename: 'Paul',
            surname: 'Smith',
          },
        },
      ],
    },
    {
      id: 5,
      description: 'Domestic Abuse Perpetrator',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: true,
      removalHistory: [
        {
          notes: 'Some removal notes',
          removalDate: '2022-11-18',
          removedBy: {
            forename: 'Paul',
            surname: 'Smith',
          },
        },
      ],
    },
    {
      id: 6,
      description: 'Risk to Known Adult',
      notes: 'Some notes',
      nextReviewDate: '2025-08-18',
      mostRecentReviewDate: '2023-12-18',
      createdDate: '2022-12-18',
      createdBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      removed: true,
      removalHistory: [
        {
          notes: 'Some removal notes',
          removalDate: '2022-11-18',
          removedBy: {
            forename: 'Paul',
            surname: 'Smith',
          },
        },
      ],
    },
  ],
} as unknown as PersonRiskFlags
