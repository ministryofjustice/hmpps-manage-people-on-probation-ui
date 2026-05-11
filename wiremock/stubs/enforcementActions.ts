import superagent, { SuperAgentRequest } from 'superagent'
import { WiremockMapping } from '../../integration_tests/utils'

const getStub = (): WiremockMapping => {
  const mapping: WiremockMapping = {
    request: {
      urlPathPattern: '/mas/user/USER1/enforcement-contacts',
      method: 'GET',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
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
    enforcementActions: [],
  }

  return mapping
}

const stubNoEnforcementActions = (): SuperAgentRequest => {
  return superagent.post('http://localhost:9091/__admin/mappings').send(getStub())
}

export default { stubNoEnforcementActions }
