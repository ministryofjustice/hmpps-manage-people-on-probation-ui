import superagent, { SuperAgentRequest } from 'superagent'

const stubPostMasOutlookEvent = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/supervision/calendar/event',
      method: 'POST',
    },
    response: {
      status: 200,
      jsonBody: {
        id: 'id-1',
        subject: 'subject',
        startDate: '2025-10-16T14:55:23.537Z',
        endDate: '2025-10-16T15:55:23.537Z',
        attendees: ['attendees-1', 'attendees-2'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
const stubSchuleOutlookEvent500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: '/supervision/calendar/event',
      method: 'POST',
    },
    response: {
      status: 500,
      jsonBody: { message: '500 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubUserDetails404Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: '/mas/user/[^/]+',
      method: 'GET',
    },
    response: {
      status: 404,
      jsonBody: { message: 'User not found' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
export default { stubPostMasOutlookEvent, stubSchuleOutlookEvent500Response, stubUserDetails404Response }
