import httpMocks from 'node-mocks-http'
import { AppointmentType } from '../models/Appointments'
import { Sentence } from '../data/model/sentenceDetails'
import { constructNextAppointmentSession } from './constructAppointmentSession'
import { Activity, PersonAppointment } from '../data/model/schedule'
import { mockAppResponse } from '../controllers/mocks'
import { Name } from '../data/model/personalDetails'

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
  {
    code: 'CODC',
    description: 'Planned Doorstep Contact (NS)',
    isPersonLevelContact: true,
    isLocationRequired: true,
  },
]

const crn = 'X000001'
const username = 'user-1'
const externalReference = 'urn:uk:gov:hmpps:manage-supervision-service:appointment:c8d13f72'

const rescheduleAppointment = {
  whoNeedsToReschedule: 'POP',
  reason: 'why appointment needs to be rescheduled',
  files: ['file1', 'file2'],
  sensitivity: 'YES',
  previousStart: '2024-02-21T10:15:00.382936Z[Europe/London]',
  previousEnd: '2024-02-21T10:30:00.382936Z[Europe/London]',
}

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
  eventId: 49,
  nsiId: null,
  externalReference,
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

const expectedSession = (values: Record<string, string | number | Record<string, string | Name>>) => {
  const { providerCode, teamCode, username: officerUserName, code } = mockAppointment.officer
  const { code: locationCode } = mockAppointment.location
  const { eventId, isVisor, startDateTime: date, endDateTime: end } = mockAppointment
  return {
    user: {
      providerCode,
      teamCode,
      username: officerUserName,
      locationCode,
      staffCode: code,
      name: { forename: 'Terry', surname: 'Jones' },
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
    externalReference,
    ...values,
  }
}

describe('/middleware/constructAppointmentSession', () => {
  const mockReq = (nextAppointment = 'KEEP_TYPE') => {
    return httpMocks.createRequest({
      params: {
        crn,
      },
      body: {
        nextAppointment,
      },
      session: {
        data: {
          sentences: {
            [crn]: mockSentences,
          },
        },
      },
    })
  }

  it('should create an empty appointment session if selection is CHANGE_TYPE', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 0, eventNumber: '1234567' })
    const req = mockReq('CHANGE_TYPE')
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual({
      interval: 'DAY',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      eventId: '',
      username: res.locals.user.username,
      uuid: '',
      repeating: 'No',
      repeatingDates: [],
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should get the eventId from sentences by eventNumber if eventId not in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 0, eventNumber: '1234567' })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        eventId: '49',
      }),
    )
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set the location code to not required', () => {
    const mockAppt = mockPersonAppointmentResponse({
      location: {
        code: '',
      },
      type: 'Planned Telephone Contact (NS)',
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    const { providerCode, teamCode, username: officerUserName, code } = mockAppointment.officer
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: {
          providerCode,
          teamCode,
          username: officerUserName,
          locationCode: 'NO_LOCATION_REQUIRED',
          staffCode: code,
          name: { forename: 'Terry', surname: 'Jones' },
        },
        type: 'COPT',
      }),
    )
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should reset the dependent values if no eventId in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: undefined,
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    const { providerCode, teamCode, username: mockUsername, code } = mockAppointment.officer
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: {
          providerCode,
          teamCode,
          username: mockUsername,
          locationCode: '',
          staffCode: code,
          name: { forename: 'Terry', surname: 'Jones' },
        },
        type: '',
        eventId: '',
      }),
    )
  })

  it('should reset the dependent values if eventId but no type in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: 49,
      type: undefined,
    })
    const { providerCode, teamCode, username: mockUsername, code } = mockAppointment.officer
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: {
          providerCode,
          teamCode,
          username: mockUsername,
          locationCode: '',
          staffCode: code,
          name: { forename: 'Terry', surname: 'Jones' },
        },
        type: '',
        eventId: '49',
      }),
    )
  })

  it('should reset the location value if eventId and type but no providerCode, teamCode or username in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: 49,
      type: 'Planned Office Visit (NS)',
      officer: {
        providerCode: '123',
        teamCode: '',
        username,
      },
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        user: {
          providerCode: '',
          teamCode: '',
          username: '',
          locationCode: '',
          staffCode: '',
        },
        eventId: '49',
        type: 'COAP',
      }),
    )
  })

  it('should set until as an empty string if end date does not exist in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      endDateTime: undefined,
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ until: '', end: '' }))
  })

  it('should add requirementId if requirement component in person appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      component: {
        id: 1,
        type: 'REQUIREMENT',
      },
    })
    const req = mockReq()
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

    const req = mockReq()
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
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(expectedSession({ nsiId: '100' }))
  })

  it('should create the correct session from a person level appointment', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: undefined,
      eventNumber: undefined,
      type: 'Planned Doorstep Contact (NS)',
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({ eventId: 'PERSON_LEVEL_CONTACT', type: 'CODC' }),
    )
  })

  it('should create correct session if eventId has no match in sentences', () => {
    const mockAppt = mockPersonAppointmentResponse({
      eventId: 999,
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    const { providerCode, teamCode, username: mockUsername, code } = mockAppointment.officer
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        eventId: '',
        type: '',
        user: {
          locationCode: '',
          providerCode,
          teamCode,
          username: mockUsername,
          staffCode: code,
          name: { forename: 'Terry', surname: 'Jones' },
        },
      }),
    )
  })

  it('should create the correct session if type has not match in appointment types', () => {
    const mockAppt = mockPersonAppointmentResponse({
      type: 'Invalid Appointment Type',
    })
    const req = mockReq()
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toStrictEqual(
      expectedSession({
        type: '',
        user: {
          username: 'tony-pan',
          teamCode: 'N07CHT',
          providerCode: 'N07',
          locationCode: '',
          staffCode: '12345',
          name: { forename: 'Terry', surname: 'Jones' },
        },
      }),
    )
  })

  it('should include rescheduleAppointment when selection is RESCHEDULE and session has reschedule data', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 49 })
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: mockAppointment.id,
      },
      body: {
        nextAppointment: 'RESCHEDULE',
      },
      session: {
        data: {
          sentences: {
            [crn]: mockSentences,
          },
          appointments: {
            [crn]: {
              [mockAppointment.id]: {
                rescheduleAppointment,
              },
            },
          },
        },
      },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toBeDefined()
    expect(res.locals.nextAppointmentSession.rescheduleAppointment).toEqual(rescheduleAppointment)
  })

  it('should not include rescheduleAppointment when selection is RESCHEDULE but no reschedule data in session', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 49 })
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: mockAppointment.id,
      },
      body: {
        nextAppointment: 'RESCHEDULE',
      },
      session: {
        data: {
          sentences: {
            [crn]: mockSentences,
          },
          appointments: {
            [crn]: {
              [mockAppointment.id]: {
                // no rescheduleAppointment here
              },
            },
          },
        },
      },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toBeDefined()
    expect(res.locals.nextAppointmentSession.rescheduleAppointment).toStrictEqual({
      previousEnd: '2024-02-21T10:30:00.382936Z[Europe/London]',
      previousStart: '2024-02-21T10:15:00.382936Z[Europe/London]',
    })
  })

  it('should not include rescheduleAppointment when selection is KEEP_TYPE even if reschedule data exists', () => {
    const mockAppt = mockPersonAppointmentResponse({ eventId: 49 })
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: mockAppointment.id,
      },
      body: {
        nextAppointment: 'KEEP_TYPE',
      },
      session: {
        data: {
          sentences: {
            [crn]: mockSentences,
          },
          appointments: {
            [crn]: {
              [mockAppointment.id]: {
                rescheduleAppointment,
              },
            },
          },
        },
      },
    })
    const res = mockAppResponse({
      personAppointment: mockAppt,
      appointmentTypes: mockTypes,
    })
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toBeDefined()
    expect(res.locals.nextAppointmentSession).not.toHaveProperty('rescheduleAppointment')
  })
})
