import httpMocks from 'node-mocks-http'
import { AppointmentType } from '../models/Appointments'
import { Sentence } from '../data/model/sentenceDetails'
import { constructNextAppointmentSession } from './constructAppointmentSession'
import { Activity, PersonAppointment } from '../data/model/schedule'
import { mockAppResponse } from '../controllers/mocks'

const nextSpy = jest.fn()
const mockTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COPT',
    description: 'Planned Telephone Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: false,
  },
]

const crn = 'X000001'
const username = 'user-1'

const mockSentences: Sentence[] = [
  {
    id: 49,
    eventNumber: '1234567',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate: '2025-05-31',
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
  {
    id: 48,
    eventNumber: '7654321',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate: '2025-05-31',
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
]

const mockAppointment: Activity = {
  id: '6',
  eventNumber: '12345',
  type: 'Planned Office Visit (NS)',
  startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
  endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
  rarToolKit: 'Choices and Changes',
  isSensitive: false,
  didTheyComply: false,
  hasOutcome: false,
  wasAbsent: true,
  appointmentNotes: [
    { id: 1, createdBy: '', note: 'Some notes' },
    { id: 2, createdBy: '', note: 'Some more notes' },
  ],
  officer: {
    code: '12345',
    name: {
      forename: 'Terry',
      surname: 'Jones',
    },
    username: 'tony-pan',
    teamCode: 'N07CHT',
    providerCode: 'N07',
  },
  location: {
    code: 'N56NTME',
    buildingName: 'The Building',
    buildingNumber: '77',
    streetName: 'Some Street',
    district: 'Some City Centre',
    town: 'London',
    county: 'Essex',
    postcode: 'NW10 1EP',
  },
  documents: [
    {
      id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
      name: 'Eula-Schmeler-X000001-UPW.pdf',
      lastUpdated: '2023-04-06T11:06:25.672587+01:00',
    },
    {
      id: 'c2650260-9568-476e-a293-0b168027a5f1',
      name: 'Eula-Schmeler-X000001-UPW.pdf',
      lastUpdated: '2023-04-06T11:09:45.860739+01:00',
    },
    {
      id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
      name: 'Eula-Schmeler-X000001-UPW.pdf',
      lastUpdated: '2023-04-06T11:21:17.06356+01:00',
    },
  ],
  lastUpdated: '2023-03-20',
  lastUpdatedBy: {
    forename: 'Paul',
    surname: 'Smith',
  },
  deliusManaged: false,
  isVisor: true,
  eventId: 2501192724,
  nsiId: null,
}

const mockPersonAppointmentResponse = (values: Partial<Activity>): PersonAppointment => ({
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn,
    dateOfBirth: '1979-08-18',
  },
  appointment: {
    ...mockAppointment,
    ...values,
  },
})

const expectedSession = (values: Record<string, string | number | Record<string, string>>) => {
  const { providerCode, teamCode, username: officerUserName } = mockAppointment.officer
  const { code: locationCode } = mockAppointment.location
  const { eventId, isVisor, startDateTime: date, endDateTime: end, isSensitive } = mockAppointment
  return {
    user: {
      providerCode,
      teamCode,
      username: officerUserName,
      locationCode,
    },
    type: 'COAP',
    visorReport: isVisor ? 'Yes' : 'No',
    date,
    start: date,
    end,
    until: end,
    interval: 'DAY',
    numberOfAppointments: '1',
    numberOfRepeatAppointments: '0',
    eventId: eventId.toString(),
    username,
    uuid: '',
    repeating: 'No',
    repeatingDates: [] as string[],
    notes: 'Some notes\nSome more notes',
    sensitivity: isSensitive ? 'Yes' : 'No',
    ...values,
  }
}

describe('/middleware/constructAppointmentSession', () => {
  const req = httpMocks.createRequest({
    params: {
      crn,
    },
    session: {
      data: {
        sentences: {
          [crn]: mockSentences,
        },
      },
    },
  })

  it('should get the eventId from sentences by eventNumber if eventId not in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 0, eventNumber: '1234567' })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ eventId: '49' }))
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should use appointment note', () => {
    const mockAppt = mockPersonAppointmentResponse({
      appointmentNotes: undefined,
      appointmentNote: { id: 1, note: 'some note' },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ notes: 'some note' }))
  })
  it('should set the location code to not required', () => {
    const mockAppt = mockPersonAppointmentResponse({
      location: {
        code: '',
      },
      type: 'Planned Telephone Contact (NS)',
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    const { providerCode, teamCode, username: officerUserName } = mockAppointment.officer
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: { providerCode, teamCode, username: officerUserName, locationCode: 'NO_LOCATION_REQUIRED' },
        type: 'COPT',
      }),
    )
    expect(nextSpy).toHaveBeenCalled()
  })
  it('should reset the dependent values if no eventId in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: undefined,
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: { providerCode: 'N07', teamCode: 'N07CHT', username: 'tony-pan', locationCode: '' },
        type: '',
        eventId: '',
      }),
    )
  })
  it('should reset the dependent values if no type in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      type: undefined,
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: { providerCode: 'N07', teamCode: 'N07CHT', username: 'tony-pan', locationCode: '' },
        type: '',
      }),
    )
  })
  it('should set until as an empty string if end date does not exist in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      endDateTime: undefined,
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ until: '', end: '' }))
  })
  it('should reset the location value if no providerCode, teamCode or username in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      officer: {
        providerCode: '123',
        teamCode: '',
        username,
      },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({ user: { providerCode: '123', teamCode: '', username, locationCode: '' } }),
    )
  })
  it('should add requirementId if requirement component in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      component: {
        id: 1,
        type: 'REQUIREMENT',
      },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ requirementId: '1' }))
  })
  it('should add licenceConditionId if licence condition component in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      component: {
        id: 2,
        type: 'LICENCE_CONDITION',
      },
    })

    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ licenceConditionId: '2' }))
  })
  it('should add nsiId if nsi in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      nsiId: 100,
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ nsiId: '100' }))
  })
})
