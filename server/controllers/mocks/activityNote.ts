import { PersonAppointment } from '../../data/model/schedule'

export const mockActivityNote = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  appointment: {
    id: 11,
    type: 'Phone call',
    description: '',
    startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
    endDateTime: '2044-12-22T09:30:00.382936Z[Europe/London]',
    rarToolKit: 'Choices and Changes',
    rarCategory: 'Stepping Stones',
    isSensitive: false,
    hasOutcome: false,
    wasAbsent: true,
    appointmentNote: {
      id: 1,
      createdBy: 'Tom Brady',
      createdByDate: '2024-10-29',
      note: 'Email sent to Stuart',
    },
    isAppointment: false,
    isCommunication: true,
    isPhoneCallFromPop: true,
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
} as unknown as PersonAppointment
