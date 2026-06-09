import superagent, { SuperAgentRequest } from 'superagent'

const stubContactOutcomes = ({
  matchedResponsePeriodDays = true,
}: {
  matchedResponsePeriodDays?: boolean
} = {}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/contact/types/.*/outcomes',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        outcomes: [
          {
            code: 'AFTA',
            description: 'Failed To Attend',
            enforcementActions: [
              { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
              {
                code: 'EA12',
                description: 'Decision Pending Response from Person on Probation',
                defaultResponsePeriodDays: matchedResponsePeriodDays ? 7 : undefined,
              },
            ],
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubContactOutcomes,
}
