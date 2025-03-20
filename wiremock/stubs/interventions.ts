import superagent, { SuperAgentRequest } from 'superagent'

const stubNoInterventions = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/interventions/probation-case/X000001/referral',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: [],
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoInterventions }
