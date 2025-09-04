import { PersonAppointment } from '../../data/model/schedule'

export const mockPersonAppointment = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  appointment: {
    id: 1,
    type: 'Phone call',
    startDateTime: '2024-12-22T09:15:00.382936Z[Europe/London]',
    rarToolKit: 'Choices and Changes',
    isSensitive: false,
    hasOutcome: false,
    wasAbsent: true,
    notes: 'Some notes',
    officer: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    },
    lastUpdated: '2023-03-20',
    lastUpdatedBy: {
      forename: 'Paul',
      surname: 'Smith',
    },
  },
} as unknown as PersonAppointment
