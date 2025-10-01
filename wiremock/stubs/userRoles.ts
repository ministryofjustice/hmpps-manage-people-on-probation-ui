import superagent, { SuperAgentRequest } from 'superagent'

const stubNoRolesFound = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1',
      method: 'GET',
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubRoleNotPresent = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        roles: ['WRONG_ROLE'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubAuthSentencePlan = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/auth/oauth/token',
      method: 'POST',
    },
    response: {
      status: 200,
      jsonBody: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJVU0VSMSIsInNjb3BlIjpbInJlYWQiXSwiYXV0aF9zb3VyY2UiOiJkZWxpdXMiLCJhdXRob3JpdGllcyI6WyJST0xFX01BTkFHRV9TVVBFUlZJU0lPTlMiLCJST0xFX1NFTlRFTkNFX1BMQU4iXSwianRpIjoiODNiNTBhMTAtY2NhNi00MWRiLTk4NWYtZTg3ZWZiMzAzZGRiIiwiY2xpZW50X2lkIjoiY2xpZW50aWQiLCJpYXQiOjE3MDE5NTEzNjgsImV4cCI6OTk5OTk5OTk5OX0.jRVDkAAM-w-TyoNenQa9pvCuD86eCpX3WZfY5I9jJKs',
        token_type: 'bearer',
        user_name: 'USER1',
        expires_in: 599,
        scope: 'read',
        internalUser: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoRolesFound, stubRoleNotPresent, stubAuthSentencePlan }
