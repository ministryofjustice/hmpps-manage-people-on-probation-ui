import httpMocks from 'node-mocks-http'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { Sentence } from '../data/model/sentenceDetails'
import { constructNextAppointmentSession } from './constructAppointmentSession'
import { PersonAppointment } from '../data/model/schedule'

const nextSpy = jest.fn()
const mockTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
]
const mockSentences: Sentence[] = [
  {
    id: 2501192724,
    eventNumber: '12345',
    order: null,
    nsis: null,
    licenceConditions: null,
    requirements: null,
  },
  {
    id: 2501192725,
    eventNumber: '5678',
    order: null,
    nsis: null,
    licenceConditions: null,
    requirements: null,
  },
]

function setup(sentences: Sentence[], appointmentTypes: AppointmentType[], appointment: PersonAppointment) {
  const req = httpMocks.createRequest({
    params: {
      crn: 'X000001',
      id: 100,
    },
    session: {},
  })
  const res = {
    locals: {
      user: {
        username: 'USER1',
      },
      sentences,
      appointmentTypes,
      personAppointment: appointment,
    },
  } as unknown as AppResponse

  return { req, res }
}

describe('/middleware/constructAppointmentSession', () => {
  it('should construct a valid session from the mock value', () => {
    const mockPersonAppointment = {
      personSummary: {
        name: {
          forename: 'Eula',
          surname: 'Schmeler',
        },
        crn: 'X000001',
        dateOfBirth: '1979-08-18',
      },
      appointment: {
        id: 6,
        eventNumber: '12345',
        type: 'Planned Office Visit (NS)',
        startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
        endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
        rarToolKit: 'Choices and Changes',
        isSensitive: false,
        didTheyComply: false,
        hasOutcome: false,
        wasAbsent: true,
        appointmentNotes: [{ id: 1, createdBy: '', note: 'Some notes', hasNoteBeenTruncated: false }],
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
        component: {
          id: 80,
          type: 'LICENCE_CONDITION',
        },
        nsiId: null,
      },
    } as unknown as PersonAppointment
    const { res, req } = setup(mockSentences, mockTypes, mockPersonAppointment)
    const expected: AppointmentSession = {
      user: {
        providerCode: 'N07',
        teamCode: 'N07CHT',
        username: 'tony-pan',
        locationCode: 'N56NTME',
      },
      type: 'COAP',
      visorReport: 'Yes',
      date: '2024-02-21T10:15:00.382936Z[Europe/London]',
      start: '2024-02-21T10:15:00.382936Z[Europe/London]',
      end: '2024-02-21T10:30:00.382936Z[Europe/London]',
      until: '2024-02-21T10:30:00.382936Z[Europe/London]',
      interval: 'DAY',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      eventId: '2501192724',
      username: 'USER1',
      uuid: '',
      repeating: 'No',
      repeatingDates: [],
      notes: 'Some notes',
      sensitivity: 'No',
      licenceConditionId: '80',
    }
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toEqual(expected)
    expect(nextSpy).toHaveBeenCalled()
  })
  it('should construct a valid session from the mock value (further coverage)', () => {
    const mockPersonAppointment = {
      personSummary: {
        name: {
          forename: 'Eula',
          surname: 'Schmeler',
        },
        crn: 'X000001',
        dateOfBirth: '1979-08-18',
      },
      appointment: {
        id: 6,
        eventNumber: '12345',
        type: 'Planned Office Visit (NS)',
        startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
        endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
        rarToolKit: 'Choices and Changes',
        isSensitive: true,
        didTheyComply: false,
        hasOutcome: false,
        wasAbsent: true,
        appointmentNote: { id: 1, createdBy: '', note: 'Some notes', hasNoteBeenTruncated: false },
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
        documents: [],
        lastUpdated: '2023-03-20',
        lastUpdatedBy: {
          forename: 'Paul',
          surname: 'Smith',
        },
        deliusManaged: false,
        isVisor: false,
        eventId: 2501192724,
        component: {
          id: 80,
          type: 'REQUIREMENT',
        },
        nsiId: 10,
      },
    } as unknown as PersonAppointment
    const { res, req } = setup(mockSentences, mockTypes, mockPersonAppointment)
    const expected: AppointmentSession = {
      user: {
        providerCode: 'N07',
        teamCode: 'N07CHT',
        username: 'tony-pan',
        locationCode: 'I do not need to pick a location',
      },
      type: 'COAP',
      visorReport: 'No',
      date: '2024-02-21T10:15:00.382936Z[Europe/London]',
      start: '2024-02-21T10:15:00.382936Z[Europe/London]',
      end: '2024-02-21T10:30:00.382936Z[Europe/London]',
      until: '2024-02-21T10:30:00.382936Z[Europe/London]',
      interval: 'DAY',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      eventId: '2501192724',
      username: 'USER1',
      uuid: '',
      repeating: 'No',
      repeatingDates: [],
      notes: 'Some notes',
      sensitivity: 'Yes',
      requirementId: '80',
      nsiId: '10',
    }
    constructNextAppointmentSession(req, res, nextSpy)
    expect(res.locals.nextAppointmentSession).toEqual(expected)
    expect(nextSpy).toHaveBeenCalled()
  })
})
