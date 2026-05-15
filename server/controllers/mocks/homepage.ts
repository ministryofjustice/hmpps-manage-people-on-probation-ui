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
  enforcementContacts: [
    {
      id: 12345,
      caseName: {
        surname: 'Smith',
        forename: 'John',
        middleName: 'Michael',
      },
      crn: 'X123456',
      dob: '1988-04-12',
      appointmentType: 'Office Appointment',
      appointmentDate: '2026-05-01',
      appointmentOutcome: 'Unacceptable absence',
      enforcementAction: 'Breach initiated',
      evidenceDueDate: '2026-05-08',
      deliusManaged: true,
    },
  ],
} as Homepage
