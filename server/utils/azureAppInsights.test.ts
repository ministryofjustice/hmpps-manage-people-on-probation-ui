//  setup, defaultClient, TelemetryClient, DistributedTracingModes
import * as applicationInsights from 'applicationinsights'
import { defaultName, version, initialiseAppInsights, buildAppInsightsClient } from './azureAppInsights'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

const applicationName = 'mock application name'
const mockVersion = '1_0_0'

jest.mock('../applicationInfo', () => ({
  ...jest.requireActual('../applicationInfo'),
  __esModule: true,
  default: jest.fn(() => ({
    applicationName,
    version: mockVersion,
    buildNumber: '',
    gitRef: '',
    gitShortHash: '#gitShortHash',
    productId: '',
    branchName: '',
  })),
}))

jest.mock('applicationinsights', () => ({
  ...jest.requireActual('../applicationinsights'),
  __esModule: true,
}))

jest.mock('applicationinsights', () => ({
  __esModule: true,
  setup: jest.fn(() => ({
    setDistributedTracingMode: jest.fn(() => ({
      start: jest.fn(),
    })),
  })),
  start: jest.fn().mockReturnThis(),
  DistributedTracingModes: jest.fn(() => ({
    AI_AND_W3C: 'ai_and_w3c',
  })),
  defaultClient: {
    context: {
      tags: {
        'ai.cloud.role': 'mock-role',
      },
    },
    addTelemetryProcessor: jest.fn(),
  },
}))

describe('utils/azureAppInsights', () => {
  describe('defaultName()', () => {
    it('should return the application name', () => {
      expect(defaultName()).toEqual(applicationName)
    })
  })
  describe('version()', () => {
    it('should return the build version', () => {
      expect(version()).toEqual(mockVersion)
    })
  })
  describe('initialiseAppInsights()', () => {
    const consoleLogSpy = jest.spyOn(console, 'log')
    beforeEach(() => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'X1234'
    })
    it('should log to the console', () => {
      initialiseAppInsights()
      expect(consoleLogSpy).toHaveBeenCalledWith('Enabling azure application insights')
    })
  })

  describe('buildAppInsightsClient()', () => {
    it('should call the setup()', () => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'X1234'
      const setupSpy = jest.spyOn(applicationInsights, 'setup')
      buildAppInsightsClient()
      expect(applicationInsights.defaultClient.context.tags['ai.cloud.role']).toEqual(applicationName)
      expect(applicationInsights.defaultClient.context.tags['ai.application.ver']).toEqual(mockVersion)
      expect(setupSpy).toHaveBeenCalled()
    })
    it('should return the default client', () => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'X1234'
      expect(buildAppInsightsClient()).toEqual(applicationInsights.defaultClient)
    })
    it('should return null if connection string is undefined', () => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = ''
      expect(buildAppInsightsClient(applicationName)).toEqual(null)
    })
    it('addTelemetryProcessor()', () => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'X1234'
      const addTelemetryProcessorMock = applicationInsights.defaultClient.addTelemetryProcessor as jest.Mock
      const telemetryProcessor = addTelemetryProcessorMock.mock.calls[0][0]
      const envelopeMock = {
        data: {
          baseData: {
            url: '/ping',
          },
        },
      }
      const result = telemetryProcessor(envelopeMock)
      expect(result).toBe(false)
      envelopeMock.data.baseData.url = '/some-url'
      const result2 = telemetryProcessor(envelopeMock)
      expect(result2).toBe(true)
    })
  })
})
