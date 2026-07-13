import superagent, { SuperAgentRequest } from 'superagent'
import * as flags from '../mappings/flipt.json'

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
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubDisableNonCompliance = (): SuperAgentRequest =>
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

const stubEnableShowMatchWithConcern = (): SuperAgentRequest =>
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
            key: 'enableShowMatchWithConcern',
            name: 'enableShowMatchWithConcern',
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

const stubDisableEMDIOverviewShowGPSData = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags.filter(f => f.key !== 'enableEMDIOverviewShowGPSData'),
          {
            key: 'enableEMDIOverviewShowGPSData',
            name: 'enableEMDIOverviewShowGPSData',
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

const stubDisableEnforcementContacts = (): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags.filter(f => f.key !== 'enableEnforcementContacts'),
          {
            key: 'enableEnforcementContacts',
            name: 'enableEnforcementContacts',
            description: '',
            enabled: false,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-06-12T12:00:00.000000Z',
            updatedAt: '2026-06-12T12:00:00.000000Z',
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

const stubFeatureFlag = ({ key, enabled }: { key: string; enabled: boolean }): SuperAgentRequest =>
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
          ...flags.mappings[0].response.jsonBody.flags.filter(f => f.key !== key),
          {
            key,
            name: key,
            description: '',
            enabled,
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

const stubEnableEsupervisionEligibility = (): SuperAgentRequest =>
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
            key: 'enableEsupervisionEligibility',
            name: 'enableEsupervisionEligibility',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-06-17T12:00:00.000000Z',
            updatedAt: '2026-06-17T12:00:00.000000Z',
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

const stubEnableEsupervisionRationale = (): SuperAgentRequest =>
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
            key: 'enableEsupervisionRationale',
            name: 'enableEsupervisionRationale',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-06-17T12:00:00.000000Z',
            updatedAt: '2026-06-17T12:00:00.000000Z',
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

const stubEnableESUPCheckinNewStop = (): SuperAgentRequest =>
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
            key: 'enableESUPCheckinNewStop',
            name: 'enableESUPCheckinNewStop',
            description: '',
            enabled: true,
            type: 'BOOLEAN_FLAG_TYPE',
            createdAt: '2026-07-08T12:00:00.000000Z',
            updatedAt: '2026-07-08T12:00:00.000000Z',
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
  stubEnableESuperVision,
  stubDisableSmsReminders,
  stubDisableCompliancePage,
  stubDisableTierLink,
  stubDisableNonCompliance,
  stubEnableDeepLinks,
  stubDisableESupervisionCheckins,
  stubDisableHomePageOutcome,
  stubEnableShowMatchWithConcern,
  stubDisableEMDIOverviewShowGPSData,
  stubDisableEnforcementContacts,
  stubFeatureFlag,
  stubEnableEsupervisionEligibility,
  stubEnableEsupervisionRationale,
  stubEnableESUPCheckinNewStop,
}
