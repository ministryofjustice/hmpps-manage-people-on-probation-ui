import { PersonRiskFlag } from '../../data/model/risk'

export const mockPersonRiskFlag = {
  personSummary: {
    name: {
      forename: 'Eulaaaa',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  riskFlag: {
    id: 1,
    description: 'Restraining Order',
    nextReviewDate: '2023-12-12',
    mostRecentReviewDate: '2023-12-12',
    createdDate: '2022-12-12',
    createdBy: {
      forename: 'Paul',
      surname: 'Smith',
    },
    removed: false,
  },
} as PersonRiskFlag
