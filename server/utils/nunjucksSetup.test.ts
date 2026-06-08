import nunjucksSetup from './nunjucksSetup'
import { appWithAllRoutes } from '../routes/testutils/appSetup'
import { ApplicationInfo } from '../applicationInfo'
import type { Services } from '../services' // Import Services type
import logger from '../../logger'

jest.mock('../../logger', () => ({
  warn: jest.fn(),
}))

const mockTechnicalUpdatesService = {
  getLatestTechnicalUpdateHeading: jest.fn(() => 'Mock Technical Update Heading'),
  getTechnicalUpdates: jest.fn(),
}

const mockSearchService = {
  post: jest.fn((req, res, next) => next()),
  get: jest.fn((req, res, next) => next()),
}

const mockServices: Services = {
  technicalUpdatesService: mockTechnicalUpdatesService,
  searchService: mockSearchService,
} as unknown as Services

jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  __esModule: true,
  default: {
    environmentName: 'PRE-PRODUCTION',
    apis: {
      hmppsAuth: {
        url: 'http://mock-url',
        externalUrl: 'http://mock-url',
        timeout: {
          response: 1000,
          deadline: 1000,
        },
        agent: {},
        apiClientId: 'id',
        apiClientSecret: 'secret',
        systemClientId: 'id',
        systemClientSecret: 'secret',
      },
    },
  },
}))

const app = appWithAllRoutes({ services: mockServices })

const mockAppInfo: ApplicationInfo = {
  applicationName: '',
  version: '',
  buildNumber: '',
  gitRef: '',
  gitShortHash: '#gitShortHash',
  productId: '',
  branchName: '',
}

describe('utils/nunjucksSetup', () => {
  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.NODE_ENV
  })

  it('should set app.locals.version to the gitShortHash when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    nunjucksSetup(app, mockAppInfo, mockServices)
    expect(app.locals.version).toEqual(mockAppInfo.gitShortHash)
  })

  it('should set the app.locals.environmentNameColour to the correct value', () => {
    nunjucksSetup(app, mockAppInfo, mockServices)
    expect(app.locals.environmentNameColour).toEqual('govuk-tag--green')
  })

  it('should set the lastTechnicalUpdate global variable from the service', () => {
    nunjucksSetup(app, mockAppInfo, mockServices)
    const njkEnv = app.get('nunjucksEnv')
    expect(njkEnv.globals.lastTechnicalUpdate).toEqual('Mock Technical Update Heading')
    expect(mockTechnicalUpdatesService.getLatestTechnicalUpdateHeading).toHaveBeenCalled()
  })

  it('falls back to the undecorated object when decorateFormAttributes is called without request context', () => {
    nunjucksSetup(app, mockAppInfo, mockServices)

    const njkEnv = app.get('nunjucksEnv')

    const html = njkEnv.renderString(
      `
      {% set cfg = { value: 'original-value' } | decorateFormAttributes(['appointments', 'CRN1', 'ID1', 'date']) %}
      {{ cfg.value }}
    `,
      {},
    )

    expect(html.trim()).toEqual('original-value')
    expect(logger.warn).toHaveBeenCalledWith('decorateFormAttributes called without request context')
  })
})
