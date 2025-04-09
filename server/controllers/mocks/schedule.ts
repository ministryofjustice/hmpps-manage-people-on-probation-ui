import { Schedule } from '../../data/model/schedule'

export const mockPersonSchedule = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  appointments: [
    {
      id: 1,
      type: 'Phone call',
      startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
      rarToolKit: 'Choices and Changes',
      isSensitive: false,
      hasOutcome: false,
      isEmailOrTextFromPop: true,
      wasAbsent: true,
      notes: 'Some notes',
      officerName: {
        forename: 'Terry',
        surname: 'Jones',
      },
      lastUpdated: '2023-03-20',
      lastUpdatedBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
    },
  ],
} as unknown as Schedule
