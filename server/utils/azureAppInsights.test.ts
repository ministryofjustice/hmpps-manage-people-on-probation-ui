import applicationInfo from '../applicationInfo'

const applicationName = 'mock application name'
const mockVersion = '1_0_0'
const mockTraceId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

jest.mock('@opentelemetry/api', () => ({
  __esModule: true,
  trace: {
    getActiveSpan: jest.fn(),
  },
}))

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

jest.mock('@ministryofjustice/hmpps-azure-telemetry', () => {
  const startRecording = jest.fn()
  const addModifier = jest.fn(() => ({ startRecording }))
  const addFilter = jest.fn(() => ({ addModifier }))
  return {
    __esModule: true,
    initialiseTelemetry: jest.fn(() => ({ addFilter })),
    flushTelemetry: jest.fn(),
    telemetry: {
      processors: {
        filterSpanWherePath: jest.fn(paths => paths),
        enrichSpanNameWithHttpRoute: jest.fn(),
      },
    },
  }
})

describe('utils/azureAppInsights', () => {
  describe('defaultName()', () => {
    it('should return the application name', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { defaultName } = require('./azureAppInsights')
        expect(defaultName()).toEqual(applicationName)
      })
    })
  })

  describe('version()', () => {
    it('should return the build version', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { version } = require('./azureAppInsights')
        expect(version()).toEqual(mockVersion)
      })
    })
  })

  describe('currentTraceId()', () => {
    it('should return the trace id of the active span when there is one', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { trace } = require('@opentelemetry/api')
        trace.getActiveSpan.mockReturnValue({ spanContext: () => ({ traceId: mockTraceId }) })

        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { currentTraceId } = require('./azureAppInsights')
        expect(currentTraceId()).toEqual(mockTraceId)
      })
    })

    it('should return undefined when there is no active span', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { trace } = require('@opentelemetry/api')
        trace.getActiveSpan.mockReturnValue(undefined)

        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { currentTraceId } = require('./azureAppInsights')
        expect(currentTraceId()).toBeUndefined()
      })
    })
  })

  describe('initialisation', () => {
    it('should initialise telemetry with the connection string when set', () => {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'X1234'
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        require('./azureAppInsights')
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { initialiseTelemetry } = require('@ministryofjustice/hmpps-azure-telemetry')

        expect(initialiseTelemetry).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceName: applicationName,
            connectionString: 'X1234',
          }),
        )
        const builder = initialiseTelemetry.mock.results[0].value
        expect(builder.addFilter).toHaveBeenCalledWith(['/ping', '/metrics', '/health', '/info'])
      })
    })

    it('should initialise telemetry with an undefined connection string when not set', () => {
      delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        require('./azureAppInsights')
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const { initialiseTelemetry } = require('@ministryofjustice/hmpps-azure-telemetry')

        expect(initialiseTelemetry).toHaveBeenCalledWith(
          expect.objectContaining({
            connectionString: undefined,
          }),
        )
      })
    })
  })
})
