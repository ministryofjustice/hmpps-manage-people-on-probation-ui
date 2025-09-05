import { PersonAppointment } from '../../data/model/schedule'

export const mockActivity = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  appointment: {
    id: 16,
    type: 'Office appointment',
    description: '',
    startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
    rarToolKit: 'Choices and Changes',
    isSensitive: false,
    hasOutcome: false,
    wasAbsent: true,
    nonComplianceReason: 'Was very argumentative and left the appointment',
    didTheyComply: false,
    isAppointment: true,
    isNationalStandard: true,
    notes: 'Some notes',
    lastUpdated: '2023-03-20',
    officer: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    },
    lastUpdatedBy: {
      forename: 'Paul',
      surname: 'Smith',
    },
  },
} as unknown as PersonAppointment
