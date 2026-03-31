import superagent, { SuperAgentRequest } from 'superagent'

const getArnsStub = (sentencePlan = true, sanIndicator = true, ogrs4 = true, ogrs4SummaryCardDetail = false) => ({
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
          key: 'enableSentencePlan',
          name: 'enableSentencePlan',
          description: '',
          enabled: sentencePlan,
          type: 'BOOLEAN_FLAG_TYPE',
          createdAt: '2025-01-13T15:28:37.920581Z',
          updatedAt: '2025-01-13T17:06:39.269084Z',
          rules: [] as string[],
          rollouts: [] as string[],
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
        {
          key: 'enableOGRS4',
          name: 'enableOGRS4',
          description: '',
          enabled: ogrs4,
          type: 'BOOLEAN_FLAG_TYPE',
          createdAt: '2025-01-13T15:28:37.920581Z',
          updatedAt: '2025-01-13T17:06:39.269084Z',
          rules: [],
          rollouts: [],
        },
        {
          key: 'enableOGRS4SummaryCardDetail',
          name: 'enableOGRS4SummaryCardDetail',
          description: '',
          enabled: ogrs4SummaryCardDetail,
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
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubDisableSmsReminders = (): SuperAgentRequest =>
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
            key: 'enableSmsReminders',
            name: 'enableSmsReminders',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableCompliancePage',
            name: 'enableCompliancePage',
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

const stubDisableCompliancePage = (): SuperAgentRequest =>
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
            key: 'enableSmsReminders',
            name: 'enableSmsReminders',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableCompliancePage',
            name: 'enableCompliancePage',
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

const stubDisableTierLink = (): SuperAgentRequest =>
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
            key: 'enableSmsReminders',
            name: 'enableSmsReminders',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableCompliancePage',
            name: 'enableCompliancePage',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableTierLink',
            name: 'enableTierLink',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableOGRS4',
            name: 'enableOGRS4',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableOGRS4SummaryCardDetail',
            name: 'enableOGRS4SummaryCardDetail',
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

const stubDisableOGRS4 = (): SuperAgentRequest =>
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
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableSentencePlan',
            name: 'enableSentencePlan',
            description: '',
            enabled: true,
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
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-01-13T15:28:37.920581Z',
            updatedAt: '2025-01-13T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableSmsReminders',
            name: 'enableSmsReminders',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2025-11-17T15:28:37.920581Z',
            updatedAt: '2025-11-17T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableManageCheckins',
            name: 'enableManageCheckins',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-01-15T15:28:37.920581Z',
            updatedAt: '2026-01-15T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableCompliancePage',
            name: 'enableCompliancePage',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-01-15T15:28:37.920581Z',
            updatedAt: '2026-01-15T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableContactLog',
            name: 'enableContactLog',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-02-02T12:00:00.000000Z',
            updatedAt: '2026-02-02T12:00:00.000000Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableCreateContact',
            name: 'enableCreateContact',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-01-30T15:28:37.920581Z',
            updatedAt: '2026-01-30T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableTierLink',
            name: 'enableTierLink',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-01-30T15:28:37.920581Z',
            updatedAt: '2026-01-30T17:06:39.269084Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableDeliusClient',
            name: 'enableDeliusClient',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-02-26T12:00:00.000000Z',
            updatedAt: '2026-02-26T12:00:00.000000Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableOGRS4',
            name: 'enableOGRS4',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-02-26T12:00:00.000000Z',
            updatedAt: '2026-02-26T12:00:00.000000Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableOGRS4SummaryCardDetail',
            name: 'enableOGRS4SummaryCardDetail',
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
  stubNoSentencePlan,
  stubNoSanIndicator,
  stubNoSentencePlanAndSanIndicator,
  stubDisableRescheduleAppointment,
  stubDisableSmsReminders,
  stubDisableCompliancePage,
  stubDisableTierLink,
  stubDisableOGRS4,
}
