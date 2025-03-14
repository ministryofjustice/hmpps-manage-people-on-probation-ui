import superagent, { SuperAgentRequest } from 'superagent'
import { WiremockMapping } from '../../integration_tests/utils'

const getStub = (type: 'upcoming' | 'no-outcome', status: 200 | 500): WiremockMapping => {
  const mapping: WiremockMapping = {
    request: {
      urlPathPattern: `/mas/user/USER1/schedule/${type}`,
      method: 'GET',
    },
    response: {
      status,

      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
  if (status === 200) {
    mapping.response.jsonBody = {
      size: 15,
      page: 0,
      totalResults: 54,
      totalPages: 6,
      name: {
        forename: 'Eula',
        middleName: '',
        surname: 'Schmeler',
      },
      appointments: [],
    }
  }
  return mapping
}

const stubNoUpcomingAppointments = (): SuperAgentRequest => {
  const stub = getStub('upcoming', 200)
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubUpcomingAppointments500Response = (): SuperAgentRequest => {
  const stub = getStub('upcoming', 500)
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubNoOutcomesToLog = (): SuperAgentRequest => {
  const stub = getStub('no-outcome', 200)
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

export default { stubNoUpcomingAppointments, stubUpcomingAppointments500Response, stubNoOutcomesToLog }
