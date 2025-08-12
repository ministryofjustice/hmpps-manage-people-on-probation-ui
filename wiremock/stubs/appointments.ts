import { DateTime } from 'luxon'
import superagent, { SuperAgentRequest } from 'superagent'
import { WiremockMapping } from '../../integration_tests/utils'

const getScheduleStub = ({ hasNextAppointment = false } = {}): WiremockMapping => {
  const mapping: WiremockMapping = {
    request: {
      urlPattern: '/mas/schedule/.*/upcoming',
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
        appointments: [
          {
            id: 6,
            type: 'Phone call',
            startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
            rarToolKit: 'Choices and Changes',
            isSensitive: false,
            hasOutcome: false,
            isEmailOrTextFromPop: true,
            wasAbsent: true,
            notes: 'Some notes',
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
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
  if (hasNextAppointment) {
    mapping.response.jsonBody.appointments = [
      ...mapping.response.jsonBody.appointments,
      {
        id: 7,
        type: 'Phone call',
        startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
        rarToolKit: 'Choices and Changes',
        isSensitive: false,
        hasOutcome: false,
        isEmailOrTextFromPop: true,
        wasAbsent: true,
        notes: 'Some notes',
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
    ]
  }
  return mapping
}

const getAppointmentStub = ({
  isFuture = true,
  managedType = true,
  documents = false,
  notes = false,
  homeAddress = false,
} = {}): WiremockMapping => {
  const mapping: WiremockMapping = {
    request: {
      urlPattern: '/mas/schedule/.*/appointment/6',
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
          type: 'Other call',
          startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
          endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
          rarToolKit: 'Choices and Changes',
          isSensitive: false,
          didTheyComply: false,
          hasOutcome: false,
          wasAbsent: true,
          isInPast: true,
          isPastAppointment: true,
          appointmentNotes: [],
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
          documents: [],
          lastUpdated: '2023-03-20',
          officerName: {
            forename: 'Terry',
            surname: 'Jones',
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
  if (managedType) {
    mapping.response.jsonBody.appointment.type = '3 Way Meeting (NS)'
  }
  if (isFuture) {
    const startTime = DateTime.now().plus({ days: 1 }).toISO()
    const endTime = DateTime.now().plus({ days: 1, hours: 1 }).toISO()
    mapping.response.jsonBody.appointment.startDateTime = startTime
    mapping.response.jsonBody.appointment.endDateTime = endTime
    mapping.response.jsonBody.appointment.isInPast = false
    mapping.response.jsonBody.appointment.isPastAppointment = false
  }
  if (notes) {
    mapping.response.jsonBody.appointment.appointmentNotes = [
      { id: 1, createdBy: '', notes: 'Some notes', hasNoteBeenTruncated: false },
    ]
  }
  if (documents) {
    mapping.response.jsonBody.appointment.documents = [
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
    ]
  }
  if (homeAddress) {
    mapping.response.jsonBody.appointment.location = {
      ...mapping.response.jsonBody.appointment.location,
      buildingNumber: '32',
      streetName: 'SCOTLAND STREET',
      town: 'Sheffield',
      county: 'South Yorkshire',
      postcode: 'S3 7BS',
    }
  }
  return mapping
}
const stubNoUpcomingAppointmentWithCOM = (): SuperAgentRequest => {
  const stub = getScheduleStub()
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubHasUpcomingAppointmentWithCOM = (): SuperAgentRequest => {
  const stub = getScheduleStub({ hasNextAppointment: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubFutureAppointmentManagedTypeNoNotes = (): SuperAgentRequest => {
  const stub = getAppointmentStub()
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubFutureAppointmentManagedTypeWithNotes = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ notes: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubFutureAppointmentManagedTypeNoNextAppt = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ notes: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubFutureAppointmentAtHomeAddress = (): SuperAgentRequest => {
  const stub = getAppointmentStub({ homeAddress: true })
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}
const stubNoNextAppointmentWithCOM = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/schedule/.*/next-com-appointment',
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
        loggedInUserIsCOM: true,
        com: {
          forename: 'Terry',
          surname: 'Jones',
        },
        appointment: null,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

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

export default {
  stubNoUpcomingAppointmentWithCOM,
  stubHasUpcomingAppointmentWithCOM,
  stubFutureAppointmentManagedTypeNoNotes,
  stubFutureAppointmentManagedTypeWithNotes,
  stubFutureAppointmentManagedTypeNoNextAppt,
  stubFutureAppointmentAtHomeAddress,
  stubNoNextAppointmentWithCOM,
  stubAppointmentClash,
  stubAppointmentDuplicate,
}
