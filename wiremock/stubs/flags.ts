import superagent, { SuperAgentRequest } from 'superagent'

const stubTextSearchOff = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/flipt/internal/v1/evaluation/snapshot/namespace/manage-people-on-probation-ui',
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
            key: 'enableDocumentTextSearch',
            name: 'enableDocumentTextSearch',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableAppointmentCreate',
            name: 'enableAppointmentCreate',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNoRepeats = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/flipt/internal/v1/evaluation/snapshot/namespace/manage-people-on-probation-ui',
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
            key: 'enableDocumentTextSearch',
            name: 'enableDocumentTextSearch',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableRepeatAppointments',
            name: 'enableRepeatAppointments',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableAppointmentCreate',
            name: 'enableAppointmentCreate',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNoDeleteAppointmentFiles = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/flipt/internal/v1/evaluation/snapshot/namespace/manage-people-on-probation-ui',
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
            key: 'enableDocumentTextSearch',
            name: 'enableDocumentTextSearch',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableRepeatAppointments',
            name: 'enableRepeatAppointments',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableAppointmentCreate',
            name: 'enableAppointmentCreate',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableDeleteAppointmentFile',
            name: 'enableDeleteAppointmentFile',
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
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubTextSearchOff, stubNoRepeats, stubNoDeleteAppointmentFiles }
