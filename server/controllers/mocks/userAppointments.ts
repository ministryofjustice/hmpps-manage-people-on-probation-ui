import { UserAppontment } from '../../data/model/caseload'

export const mockUserAppointments = {
  totalAppointments: 5,
  totalOutcomes: 21,
  appointments: [
    {
      caseName: {
        surname: 'Morrison',
        forename: 'Stuart',
      },
      crn: 'X000001',
      location: 'HMP Wakefield',
      startTime: '2025-03-17T09:00:00Z',
      endTime: '2025-03-17T09:30:00Z',
    },
  ],
  outcomes: [
    {
      id: 0,
      caseName: { surname: 'Morrison', forename: 'Stuart' },
      crn: 'X000001',
      type: 'Home visit',
      startDateTime: '2025-03-04T11:30:00Z',
    },
  ],
} as unknown as UserAppontment
