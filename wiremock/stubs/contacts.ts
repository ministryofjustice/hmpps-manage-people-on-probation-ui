import superagent, { SuperAgentRequest } from 'superagent'

const url = 'http://localhost:9091/__admin/mappings'

const stubFrequentContactTypes = (): SuperAgentRequest =>
  superagent.post(url).send({
    request: {
      urlPattern: '/mas/contact/types',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: [
        { code: 'CO01', description: 'Office Visit', isPersonLevelContact: true },
        { code: 'CO02', description: 'Home Visit', isPersonLevelContact: true },
        { code: 'CO03', description: 'Phone Contact', isPersonLevelContact: true },
      ],
      headers: { 'Content-Type': 'application/json' },
    },
  })

const stubContactTypeDetails = (code = 'CO01'): SuperAgentRequest =>
  superagent.post(url).send({
    request: {
      urlPattern: `/mas/contact/types/${code}`,
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        code,
        description: 'Office Visit',
        defaultSensitive: 'N',
        allowedRelations: ['person', 'event'],
      },
      headers: { 'Content-Type': 'application/json' },
    },
  })

const stubCreateContactSuccess = (): SuperAgentRequest =>
  superagent.post(url).send({
    request: {
      urlPattern: '/mas/case/.*/contact',
      method: 'POST',
    },
    response: {
      status: 201, // Created
      headers: { 'Content-Type': 'application/json' },
    },
  })

export default {
  stubFrequentContactTypes,
  stubContactTypeDetails,
  stubCreateContactSuccess,
}
