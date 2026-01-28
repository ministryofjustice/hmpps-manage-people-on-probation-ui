import superagent, { SuperAgentRequest } from 'superagent'

const getArnsStub = (sentencePlan = true, sanIndicator = true) => ({
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
          key: 'enableAppointmentCreate',
          name: 'enableAppointmentCreate',
          description: '',
          enabled: true,
          type: 'BOOLEAN_FLAG_TYPE',
          createdAt: '2025-01-13T15:28:37.920581Z',
          updatedAt: '2025-01-13T17:06:39.269084Z',
          rules: [] as string[],
          rollouts: [] as string[],
        },
        {
          key: 'enableSentencePlan',
          name: 'enableSentencePlan',
          description: '',
          enabled: sentencePlan,
          type: 'BOOLEAN_FLAG_TYPE',
          createdAt: '2025-01-13T15:28:37.920581Z',
          updatedAt: '2025-01-13T17:06:39.269084Z',
          rules: [],
          rollouts: [],
        },
        {
          key: 'enableSanIndicator',
          name: 'enableSanIndicator',
          description: '',
          enabled: sanIndicator,
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

const stubRepeats = (): SuperAgentRequest =>
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

const stubNoSentencePlan = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send(getArnsStub(false, true))

const stubNoSanIndicator = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send(getArnsStub(true, false))

const stubNoSentencePlanAndSanIndicator = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send(getArnsStub(false, false))

const stubEnableESuperVision = (): SuperAgentRequest =>
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
            key: 'enableESuperVision',
            name: 'enableESuperVision',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableManageCheckins',
            name: 'enableManageCheckins',
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

const stubDisablePastAppointments = (): SuperAgentRequest =>
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
            key: 'enableESuperVision',
            name: 'enableESuperVision',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enablePastAppointments',
            name: 'enablePastAppointments',
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

const stubDisableRescheduleAppointment = (): SuperAgentRequest =>
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
            enabled: true,
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
            key: 'enableESuperVision',
            name: 'enableESuperVision',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enablePastAppointments',
            name: 'enablePastAppointments',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableRescheduleAppointment',
            name: 'enableRescheduleAppointment',
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

export default {
  stubNoRepeats,
  stubRepeats,
  stubNoDeleteAppointmentFiles,
  stubNoSentencePlan,
  stubNoSanIndicator,
  stubNoSentencePlanAndSanIndicator,
  stubEnableESuperVision,
  stubDisablePastAppointments,
  stubDisableRescheduleAppointment,
}
