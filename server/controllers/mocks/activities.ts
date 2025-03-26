import { PersonActivity } from '../../data/model/activityLog'

export const mockActivities = {
  size: 10,
  page: 0,
  totalResults: 1,
  totalPages: 1,
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  activities: [
    {
      id: 11,
      type: 'Phone call',
      startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
      endDateTime: '2044-12-22T09:30:00.382936Z[Europe/London]',
      rarToolKit: 'Choices and Changes',
      rarCategory: 'Stepping Stones',
      isSensitive: false,
      hasOutcome: false,
      wasAbsent: true,
      notes: '',
      isAppointment: false,
      isCommunication: true,
      isPhoneCallFromPop: true,
    },
  ],
} as unknown as PersonActivity
