import { Homepage } from '../../data/deliusClient'

export const mockHomepage = {
  upcomingAppointments: [
    {
      id: 0,
      name: {
        surname: 'Morrison',
        forename: 'Stuart',
      },
      crn: 'X000001',
      type: 'Planned telephone contact',
      location: 'HMP Wakefield',
      startDateTime: '2025-03-17T09:00:00Z',
      endDateTime: '2025-03-17T09:30:00Z',
    },
  ],
  appointmentsRequiringOutcomeCount: 21,
  appointmentsRequiringOutcome: [
    {
      id: 0,
      name: { surname: 'Morrison', forename: 'Stuart' },
      crn: 'X000001',
      type: 'Home visit',
      startDateTime: '2025-03-04T11:30:00Z',
    },
  ],
} as Homepage
