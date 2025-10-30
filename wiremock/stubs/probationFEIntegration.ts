import superagent, { SuperAgentRequest } from 'superagent'

const stubProbationFEAPI500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      // Match the full URL with both repeated query params in any order
      urlPattern:
        '/probation-frontend-components/api/components\\?(?:component=header&component=footer|component=footer&component=header)(?:&.*)?',
      method: 'GET',
    },
    response: {
      status: 500,
      jsonBody: { message: '500 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubDisableProbFEComponent = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      // Match the full URL with both repeated query params in any order
      urlPattern: '/flipt/internal/v1/evaluation/snapshot/namespace/manage-people-on-probation-ui',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        namespace: {
          key: 'manage-people-on-probation-ui',
        },
        flags: [
          {
            key: 'enableProbFEComponent',
            name: 'enableProbFEComponent',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
        ],
      },
    },
  })

export default { stubProbationFEAPI500Response, stubDisableProbFEComponent }
