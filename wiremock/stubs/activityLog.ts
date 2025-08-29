import superagent, { SuperAgentRequest } from 'superagent'

const stubAppointmentNoOutcomeWithNote = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/schedule/X000001/appointment/11',
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
          id: 13,
          type: 'Planned Video Contact (NS)',
          description: 'User-generated free text content',
          startDateTime: '2023-02-12T10:15:00.382936Z[Europe/London]',
          endDateTime: '2023-02-12T10:30:00.382936Z[Europe/London]',
          rarToolKit: 'Choices and Changes',
          isSensitive: false,
          hasOutcome: false,
          outcome: 'User-generated free text content',
          acceptableAbsence: false,
          wasAbsent: true,
          complied: false,
          isAppointment: true,
          isNationalStandard: true,
          appointmentNote: {
            id: 0,
            createdBy: 'Paul Smith',
            createdByDate: '2023-02-12T10:15:00.382936Z[Europe/London]',
            note: 'An appointment note',
          },
          appointmentNotes: [
            {
              id: 0,
              note: 'Stuart did not attend this appointment. I phoned him several times on his mobile and left a voicemail. I also called the Timpson shop where he works and was told that he is off sick today and this is the first time that’s he’s been ill while working here.\n\nWill keep trying his mobile throughout the day. If I haven’t had any contact from Stuart by later this afternoon, I’ll visit him at home.',
            },
          ],
          lastUpdated: '2023-03-20',
          officerName: {
            forename: 'Paulie',
            surname: 'Walnuts',
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
  })

const stubAppointmentOutcomeWithNote = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/schedule/X000001/appointment/11',
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
          id: 13,
          type: 'Planned Video Contact (NS)',
          description: 'User-generated free text content',
          startDateTime: '2023-02-12T10:15:00.382936Z[Europe/London]',
          endDateTime: '2023-02-12T10:30:00.382936Z[Europe/London]',
          rarToolKit: 'Choices and Changes',
          isSensitive: false,
          hasOutcome: true,
          outcome: 'User-generated free text content',
          acceptableAbsence: false,
          wasAbsent: true,
          complied: false,
          isAppointment: true,
          isNationalStandard: true,
          appointmentNote: {
            id: 0,
            createdBy: 'Paul Smith',
            createdByDate: '2023-02-12T10:15:00.382936Z[Europe/London]',
            note: 'An appointment note',
          },
          appointmentNotes: [
            {
              id: 0,
              note: 'Stuart did not attend this appointment. I phoned him several times on his mobile and left a voicemail. I also called the Timpson shop where he works and was told that he is off sick today and this is the first time that’s he’s been ill while working here.\n\nWill keep trying his mobile throughout the day. If I haven’t had any contact from Stuart by later this afternoon, I’ll visit him at home.',
            },
          ],
          lastUpdated: '2023-03-20',
          officerName: {
            forename: 'Paulie',
            surname: 'Walnuts',
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
  })

const stubAppointmentOutcomeWithNoNotes = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/schedule/X000001/appointment/11',
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
          id: 13,
          type: 'Planned Video Contact (NS)',
          description: 'User-generated free text content',
          startDateTime: '2023-02-12T10:15:00.382936Z[Europe/London]',
          endDateTime: '2023-02-12T10:30:00.382936Z[Europe/London]',
          rarToolKit: 'Choices and Changes',
          isSensitive: false,
          hasOutcome: true,
          outcome: 'User-generated free text content',
          acceptableAbsence: false,
          wasAbsent: true,
          complied: false,
          isAppointment: true,
          isNationalStandard: true,
          appointmentNotes: [],
          lastUpdated: '2023-03-20',
          officerName: {
            forename: 'Paulie',
            surname: 'Walnuts',
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
  })

export default { stubAppointmentNoOutcomeWithNote, stubAppointmentOutcomeWithNote, stubAppointmentOutcomeWithNoNotes }
