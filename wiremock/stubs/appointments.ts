import superagent, { SuperAgentRequest } from 'superagent'

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

export default { stubAppointmentClash }
