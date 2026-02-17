import { UserCaseload } from '../../data/model/caseload'

export const mockUserCaseload = {
  totalPages: 4,
  totalElements: 33,
  sortedBy: 'nextContact.asc',
  provider: 'London',
  staff: {
    forename: 'Paul',
    surname: 'McPhee',
  },
  caseload: [
    {
      caseName: {
        forename: 'Alton',
        middleName: '',
        surname: 'Berge',
      },
      crn: 'X000001',
      dob: '1975-09-25',
      nextAppointment: {
        id: 6,
        date: '2024-10-22T09:00:00+01:00',
        description: 'AP PA - Accommodation',
      },
      previousAppointment: {
        id: 5,
        date: '2024-09-24T09:00:00+01:00',
        description: 'AP PA - Accommodation',
      },
      latestSentence: 'CJA - Std Determinate Custody',
      numberOfAdditionalSentences: 0,
    },
  ],
  metaData: {
    sentenceTypes: [
      {
        code: '307',
        description: 'Adult Custody < 12m',
      },
      {
        code: '329',
        description: 'ORA Community Order',
      },
    ],
    contactTypes: [
      {
        code: 'APPA03',
        description: 'AP PA - Accommodation',
      },
      {
        code: 'COAI',
        description: 'Initial Appointment - In office (NS)',
      },
      {
        code: 'TCP6',
        description: 'Post Disclosure Session',
      },
    ],
  },
} as unknown as UserCaseload
