import superagent, { SuperAgentRequest } from 'superagent'
import * as flags from '../mappings/flipt.json'

const getArnsStub = (
  sentencePlan = true,
  sanIndicator = true,
  ogrs4 = true,
  ogrs4SummaryCardDetail = false,
  sentencePlanUrl = true,
) => ({
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
        {
          key: 'enableSentencePlanUrl',
          name: 'enableSentencePlanUrl',
          description: '',
          enabled: sentencePlanUrl,
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

const stubOgrs4SummaryCardEnabled = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send(getArnsStub(false, false, true, true))

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
          {
            key: 'enableESupervisionCheckins',
            name: 'enableESupervisionCheckins',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-16T12:00:00.000000Z',
            updatedAt: '2026-04-16T12:00:00.000000Z',
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
          ...flags.mappings[0].response.jsonBody.flags,
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
          ...flags.mappings[0].response.jsonBody.flags,
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
          ...flags.mappings[0].response.jsonBody.flags,
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
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEnableNonCompliance = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags,
          {
            key: 'enableNonCompliance',
            name: 'enableNonCompliance',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-02-26T12:00:00.000000Z',
            updatedAt: '2026-02-26T12:00:00.000000Z',
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

const stubEnableESupervisionCustomQuestions = (): SuperAgentRequest =>
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
            key: 'enableESupervisionCustomQuestions',
            name: 'enableESupervisionCustomQuestions',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-03-26T12:00:00.000000Z',
            updatedAt: '2026-03-26T12:00:00.000000Z',
            rules: [],
            rollouts: [],
          },
          {
            key: 'enableESupervisionCheckins',
            name: 'enableESupervisionCheckins',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-16T12:00:00.000000Z',
            updatedAt: '2026-04-16T12:00:00.000000Z',
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

const stubDisableSentencePlanUrl = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags,
          {
            key: 'enableSentencePlanUrl',
            name: 'enableSentencePlanUrl',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-02-26T12:00:00.000000Z',
            updatedAt: '2026-02-26T12:00:00.000000Z',
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

const stubEnableDeepLinks = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags,
          {
            key: 'enableDeepLinks',
            name: 'enableDeepLinks',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-10T12:00:00.000000Z',
            updatedAt: '2026-04-10T12:00:00.000000Z',
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

const stubDisableHomePageOutcome = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags,
          {
            key: 'enableHomePageOutcomesWithFilter',
            name: 'enableHomePageOutcomesWithFilter',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-10T12:00:00.000000Z',
            updatedAt: '2026-04-10T12:00:00.000000Z',
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

const stubDisableESupervisionCheckins = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags.filter(f => f.key !== 'enableESupervisionCheckins'),
          {
            key: 'enableESupervisionCheckins',
            name: 'enableESupervisionCheckins',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-16T12:00:00.000000Z',
            updatedAt: '2026-04-16T12:00:00.000000Z',
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

const stubEnableStopCheckinSensitiveFlag = (): SuperAgentRequest =>
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
            key: 'enableESupervisionCheckins',
            name: 'enableESupervisionCheckins',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-04-16T12:00:00.000000Z',
            updatedAt: '2026-04-16T12:00:00.000000Z',
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
          {
            key: 'enableStopCheckinSensitiveFlag',
            name: 'enableStopCheckinSensitiveFlag',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-05-18T12:00:00.000000Z',
            updatedAt: '2026-05-18T12:00:00.000000Z',
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
  stubEnableESuperVision,
  stubDisableSmsReminders,
  stubDisableCompliancePage,
  stubDisableTierLink,
  stubDisableOGRS4,
  stubEnableESupervisionCustomQuestions,
  stubEnableNonCompliance,
  stubEnableDeepLinks,
  stubDisableSentencePlanUrl,
  stubOgrs4SummaryCardEnabled,
  stubDisableESupervisionCheckins,
  stubDisableHomePageOutcome,
  stubEnableStopCheckinSensitiveFlag,
}
