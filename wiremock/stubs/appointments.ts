import { DateTime } from 'luxon'
import superagent, { SuperAgentRequest } from 'superagent'
import { WiremockMapping } from '../../integration_tests/utils'

interface Args {
  isFuture?: boolean
  isSensitive?: boolean
  deliusManaged?: boolean
  personLevel?: boolean
  documents?: boolean
  notes?: boolean
  hasComplied?: boolean
  hasOutcome?: boolean
  acceptableAbsence?: boolean
  locationOfficeName?: boolean
  hasRarActivity?: boolean
  noEventId?: boolean
  eventId?: number
  noType?: boolean
  noAttendee?: boolean
  noLocation?: boolean
  createNext?: boolean
  startDateTime?: string
  endDateTime?: string
  outcome?: string
  inOffice?: boolean
  contactId?: string
  enforcementActionResponseByDate?: string
  action?: string
  contactType?: string
}

const getAppointmentStub = (
  {
    isFuture = true,
    isSensitive = false,
    deliusManaged = false,
    personLevel = false,
    documents = false,
    notes = false,
    hasComplied = undefined,
    hasOutcome = false,
    acceptableAbsence = undefined,
    hasRarActivity = false,
    locationOfficeName = false,
    noEventId = false,
    eventId = 48,
    noType = false,
    noAttendee = false,
    noLocation = false,
    createNext = false,
    startDateTime = '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime = '2024-02-21T10:30:00.382936Z[Europe/London]',
    outcome = '',
    inOffice = true,
    contactId = '6',
    enforcementActionResponseByDate = '2024-04-21',
    action = '',
    contactType = undefined,
  }: Args = {} as Args,
): WiremockMapping => {
  const mapping: WiremockMapping = {
    request: {
      urlPattern: `/mas/schedule/.*/appointment/${contactId}`,
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
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
          eventNumber: '7654321',
          type: 'Planned Office Visit (NS)',
          startDateTime,
          endDateTime,
          rarToolKit: 'Choices and Changes',
          appointmentNotes: [],
          appointmentNote: null,
          isSensitive,
          hasOutcome: false,
          wasAbsent: true,
          officer: {
            code: '',
            name: {
              forename: 'Terry',
              surname: 'Jones',
            },
            teamCode: 'N07AAT',
            providerCode: 'N07',
            username: 'terry-jones',
          },
          isInitial: true,
          isNationalStandard: true,
          location: {
            code: 'N56NTME',
            officeName: '',
            buildingName: 'The Building',
            buildingNumber: '77',
            streetName: 'Some Street',
            district: 'Some City Centre',
            town: 'London',
            county: 'Essex',
            postcode: 'NW10 1EP',
            ldu: '',
            telephoneNumber: '',
          },
          rescheduled: true,
          rescheduledStaff: true,
          rescheduledPop: true,
          didTheyComply: undefined,
          absentWaitingEvidence: true,
          enforcementAction: {
            responseByDate: enforcementActionResponseByDate,
          },
          rearrangeOrCancelReason: '',
          rescheduledBy: {
            forename: '',
            middleName: '',
            surname: '',
          },
          repeating: true,
          nonComplianceReason: '',
          documents: [],
          isRarRelated: true,
          rarCategory: '',
          acceptableAbsence,
          acceptableAbsenceReason: '',
          isAppointment: true,
          isCommunication: true,
          action,
          isSystemContact: true,
          isEmailOrTextFromPop: true,
          isPhoneCallFromPop: true,
          isEmailOrTextToPop: true,
          isPhoneCallToPop: true,
          isInPast: true,
          isPastAppointment: true,
          countsTowardsRAR: true,
          lastUpdated: '2023-03-20',
          lastUpdatedBy: {
            forename: 'Paul',
            surname: 'Smith',
          },
          description: '',
          outcome,
          deliusManaged: false,
          isVisor: true,
          eventId,
          component: {
            id: 0,
            description: '',
            type: 'LICENCE_CONDITION',
          },
          nsiId: 0,
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
  if (!deliusManaged) {
    mapping.response.jsonBody.appointment.type = '3 Way Meeting (NS)'
  }
  if (!inOffice) {
    mapping.response.jsonBody.appointment.type = 'Planned Telephone Contact (NS)'
  }
  if (personLevel) {
    mapping.response.jsonBody.appointment.type = 'Planned Doorstep Contact (NS)'
  }
  mapping.response.jsonBody.appointment.deliusManaged = deliusManaged
  if (isFuture) {
    mapping.response.jsonBody.appointment.isInPast = false
    mapping.response.jsonBody.appointment.isPastAppointment = false

    const now = DateTime.now().plus({ days: 1 })
    const start = `${now.toFormat('yyyy-MM-dd')}T09:00:00+01:00`
    const end = `${now.toFormat('yyyy-MM-dd')}T10:00:00+01:00`

    mapping.response.jsonBody.appointment.startDateTime = start
    mapping.response.jsonBody.appointment.endDateTime = end
  }
  if (notes) {
    mapping.response.jsonBody.appointment.appointmentNotes = [
      { id: 1, createdBy: 'Terry Jones', createdByDate: '2023-04-06', note: 'Some notes', hasNoteBeenTruncated: false },
      {
        id: 2,
        createdBy: 'Terry Jones',
        createdByDate: '2023-04-07',
        note: 'Some more notes',
        hasNoteBeenTruncated: false,
      },
    ]
  }
  if (documents) {
    mapping.response.jsonBody.appointment.documents = [
      {
        id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
        name: 'Document-1.pdf',
        lastUpdated: '2023-04-06T11:06:25.672587+01:00',
        createdAt: '2023-04-06T11:06:25.672587+01:00',
      },
      {
        id: 'c2650260-9568-476e-a293-0b168027a5f1',
        name: 'Document-2.pdf',
        lastUpdated: '2023-04-06T11:09:45.860739+01:00',
        createdAt: '2023-04-06T11:09:45.860739+01:00',
      },
      {
        id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
        name: 'Document-3.pdf',
        lastUpdated: '2023-04-06T11:21:17.06356+01:00',
        createdAt: '2023-04-06T11:21:17.06356+01:00',
      },
    ]
  }
  if (locationOfficeName) {
    mapping.response.jsonBody.appointment.location.officeName = 'Leamington Probation Office'
  }
  if (hasOutcome) {
    mapping.response.jsonBody.appointment.hasOutcome = true
    mapping.response.jsonBody.appointment.didTheyComply = hasComplied
    if (acceptableAbsence !== undefined) {
      mapping.response.jsonBody.appointment.acceptableAbsence = acceptableAbsence
      mapping.response.jsonBody.appointment.wasAbsent = true
    }
  }

  if (hasRarActivity) {
    mapping.response.jsonBody.appointment.rarCategory = 'Stepping Stones'
  }
  if (noType) {
    mapping.response.jsonBody.appointment.type = ''
  }
  if (contactType) {
    mapping.response.jsonBody.appointment.type = contactType
  }
  if (noEventId) {
    mapping.response.jsonBody.appointment.eventId = 0
    mapping.response.jsonBody.appointment.eventNumber = ''
  }
  if (noAttendee) {
    mapping.response.jsonBody.appointment.officer.teamCode = ''
    mapping.response.jsonBody.appointment.officer.providerCode = ''
    mapping.response.jsonBody.appointment.officer.username = ''
  }
  if (noLocation) {
    mapping.response.jsonBody.appointment.location = null
    mapping.response.jsonBody.appointment.officer = {
      code: '',
      name: {
        forename: 'Peter',
        surname: 'Parker',
      },
      username: 'peter-parker',
      teamCode: 'N07AAT',
      providerCode: 'N07',
    }
  }
  if (createNext) {
    mapping.response.jsonBody.appointment.eventNumber = '12345'
    mapping.response.jsonBody.appointment.officer.username = 'peter-parker'
    mapping.response.jsonBody.appointment.location.code = 'N56NTMC'
    mapping.response.jsonBody.appointment.eventId = 2501192724
  }

  return mapping
}

const getNextAppointmentStub = ({ appointment = true, usernameIsCom = true, homeAddress = false } = {}) => {
  const mapping: WiremockMapping = {
    request: {
      urlPathPattern: '/mas/schedule/.*/next-appointment',
      method: 'GET',
      queryParameters: {
        username: {
          matches: '.*',
        },
        contactId: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        usernameIsCom,
        personManager: {
          name: {
            forename: 'Terry',
            surname: 'Jones',
          },
        },
        appointment: {
          id: 6,
          type: 'Other call',
          startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
          endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
          rarToolKit: 'Choices and Changes',
          isSensitive: false,
          didTheyComply: false,
          hasOutcome: false,
          wasAbsent: true,
          appointmentNotes: [{ id: 1, createdBy: '', notes: 'Some notes', hasNoteBeenTruncated: false }],
          location: {
            buildingName: 'The Building',
            buildingNumber: '77',
            streetName: 'Some Street',
            district: 'Some City Centre',
            town: 'London',
            county: 'Essex',
            postcode: 'NW10 1EP',
            lastUpdated: '2023-03-14',
            lastUpdatedBy: {
              forename: 'Jiminy',
              surname: 'Cricket',
            },
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
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
  if (!appointment) {
    mapping.response.jsonBody.appointment = null
  }
  if (homeAddress) {
    mapping.response.jsonBody.appointment = {
      ...mapping.response.jsonBody.appointment,
      location: {
        buildingNumber: '32',
        streetName: 'SCOTLAND STREET',
        town: 'Sheffield',
        county: 'South Yorkshire',
        postcode: 'S3 7BS',
      },
    }
  }
  return mapping
}

const stubAppointment = (args: Args): SuperAgentRequest => {
  const stub = getAppointmentStub({ ...args })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubNextAppointment = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ deliusManaged: true, createNext: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubAppointmentNoEventId = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ noEventId: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubAppointmentPersonLevel = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ noEventId: true, personLevel: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubAppointmentNoType = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ noType: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubAppointmentNoLocation = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ noLocation: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubNotComNoNextAppointment = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: false, usernameIsCom: false })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubNotComNextAppointment = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: true, usernameIsCom: false })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubNotComNoNextAppointmentAtHome = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: false, usernameIsCom: false, homeAddress: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubNotComNextAppointmentAtHome = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: true, usernameIsCom: false, homeAddress: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubIsComNoNextAppointment = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: false, usernameIsCom: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubIsComNextAppointment = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: true, usernameIsCom: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubIsComNextAppointmentAtHome = (): SuperAgentRequest => {
  const stub = getNextAppointmentStub({ appointment: true, usernameIsCom: true, homeAddress: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubAppointmentClash = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/appointment/X778160/check',
      method: 'POST',
    },
    response: {
      status: 200,
      jsonBody: {
        nonWorkingDayName: 'Sunday',
        isWithinOneHourOfMeetingWith: {
          isCurrentUser: false,
          appointmentIsWith: { forename: 'Alma', surname: 'Barlow' },
          startAndEnd: '11am to 12pm',
        },
        overlapsWithMeetingWith: {
          isCurrentUser: false,
          appointmentIsWith: { forename: 'Alma', surname: 'Barlow' },
          startAndEnd: '11am to 12pm',
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubAppointmentDuplicate = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/appointment/X778160',
      method: 'POST',
    },
    response: {
      status: 409,
      jsonBody: { message: '409 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubAppointmentWithOutcomeText = (): SuperAgentRequest => {
  const stub = getAppointmentStub({
    deliusManaged: false,
    isFuture: false,
    notes: false,
    outcome: 'Recalled to custody',
  })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

export default {
  stubAppointment,
  stubAppointmentPersonLevel,
  stubAppointmentNoType,
  stubAppointmentNoLocation,
  stubNotComNoNextAppointment,
  stubNotComNextAppointment,
  stubNotComNoNextAppointmentAtHome,
  stubNotComNextAppointmentAtHome,
  stubIsComNoNextAppointment,
  stubIsComNextAppointment,
  stubIsComNextAppointmentAtHome,
  stubAppointmentClash,
  stubAppointmentDuplicate,
  stubNextAppointment,
  stubAppointmentWithOutcomeText,
  stubAppointmentNoEventId,
}
