import healthCheck from './healthCheck'
import type { ApplicationInfo } from '../applicationInfo'
import type { HealthCheckCallback, HealthCheckService } from './healthCheck'
import { getConfig } from '../config'
import { AgentConfig } from '../types/AgentConfig'

const mockedConfig = {
  apis: {
    hmppsAuth: { url: 'http://hmpps-auth.com', agent: {} as AgentConfig },
    manageUsersApi: { url: 'http://manage-users-api.com', agent: {} as AgentConfig },
    tokenVerification: { enabled: true, url: 'http://token-verification.com', agent: {} as AgentConfig },
  },
}

jest.mock('../config', () => ({
  __esModule: true,
  getConfig: jest.fn(),
}))

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Healthcheck', () => {
  const testAppInfo: ApplicationInfo = {
    applicationName: 'test',
    buildNumber: '1',
    gitRef: 'long ref',
    gitShortHash: 'short ref',
    branchName: 'main',
  }

  it('Healthcheck reports healthy', done => {
    const successfulChecks = [successfulCheck('check1'), successfulCheck('check2')]

    const callback: HealthCheckCallback = result => {
      expect(result).toEqual(
        expect.objectContaining({
          status: 'UP',
          components: {
            check1: {
              status: 'UP',
              details: 'some message',
            },
            check2: {
              status: 'UP',
              details: 'some message',
            },
          },
        }),
      )
      done()
    }

    healthCheck(testAppInfo, callback, successfulChecks)
  })

  it('Healthcheck reports unhealthy', done => {
    const successfulChecks = [successfulCheck('check1'), erroredCheck('check2')]

    const callback: HealthCheckCallback = result => {
      expect(result).toEqual(
        expect.objectContaining({
          status: 'DOWN',
          components: {
            check1: {
              status: 'UP',
              details: 'some message',
            },
            check2: {
              status: 'DOWN',
              details: 'some error',
            },
          },
        }),
      )
      done()
    }

    healthCheck(testAppInfo, callback, successfulChecks)
  })
})

function successfulCheck(name: string): HealthCheckService {
  return () =>
    Promise.resolve({
      name: `${name}`,
      status: 'UP',
      message: 'some message',
    })
}

function erroredCheck(name: string): HealthCheckService {
  return () =>
    Promise.resolve({
      name: `${name}`,
      status: 'DOWN',
      message: 'some error',
    })
}
