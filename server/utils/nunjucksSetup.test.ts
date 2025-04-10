import nunjucksSetup from './nunjucksSetup'
import { appWithAllRoutes } from '../routes/testutils/appSetup'
import { ApplicationInfo } from '../applicationInfo'

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

const app = appWithAllRoutes({})
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
  })
  it('should set app.locals.version to ', () => {
    process.env.NODE_ENV = 'production'
    nunjucksSetup(app, mockAppInfo)
    expect(app.locals.version).toEqual(mockAppInfo.gitShortHash)
  })
  it('should set the app.locals.environmentNameColour to the correct value', () => {
    nunjucksSetup(app, mockAppInfo)
    expect(app.locals.environmentNameColour).toEqual('govuk-tag--green')
  })
})
