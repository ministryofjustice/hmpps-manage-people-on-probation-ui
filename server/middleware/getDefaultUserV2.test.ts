import httpMocks, { RequestMethod } from 'node-mocks-http'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, probationPractitioner, userProviders } from '../controllers/mocks'
import { setDataValue } from '../utils'
import { Provider, Team, User } from '../data/model/caseload'
import { getDefaultUserV2 } from './getDefaultUserV2'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const nextSpy = jest.fn()

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const crn = 'X000001'
const uuid = 'a4615940-2808-4ab5-a8e0-feddecb8ae1a'
const username = 'user-1'
const name = { forename: 'Terry', surname: 'Jones' }
const email = 'terry.jones@testemail.com'
const providerCode = 'N50'
const teamCode = 'N07IVH'

const buildRequest = ({ req = {}, params = {}, query = {}, user = {}, data = {} } = {}): httpMocks.MockRequest<any> => {
  const request = {
    method: 'GET' as RequestMethod,
    params: {
      crn,
      id: uuid,
      ...params,
    },
    query: {
      ...query,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [uuid]: {
              user: {
                ...user,
              },
            },
          },
        },
        providers: {
          [username]: undefined as Provider[],
        },
        teams: {
          [username]: undefined as Team[],
        },
        staff: {
          [username]: undefined as User[],
        },
        ...data,
      },
    },
    ...req,
  }
  return httpMocks.createRequest(request)
}

const res = mockAppResponse({ user: { username }, flags: { enableMAN2344: true } })

const getUserProvidersSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserProviders')
  .mockImplementation(() => Promise.resolve(userProviders))

const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(probationPractitioner))

describe('/middleware/getDefaultUserV2()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Attending user has been set in session', () => {
    describe('MAN2334 feature flag is disabled / email is not required', () => {
      const req = buildRequest({ user: { providerCode, teamCode, username } })
      const resNoFlag = mockAppResponse({ user: { username }, flags: { enableMAN2344: false } })

      it('Should not update the session values and call next', async () => {
        await getDefaultUserV2(hmppsAuthClient)(req, resNoFlag, nextSpy)
        expect(mockSetDataValue).not.toHaveBeenCalled()
        expect(nextSpy).toHaveBeenCalled()
      })
    })

    describe('MAN2334 feature flag is enabled / email is required', () => {
      it('Should not update the session values if they are already set', async () => {
        const req = buildRequest({ user: { providerCode, teamCode, username, email, name } })
        await getDefaultUserV2(hmppsAuthClient)(req, res, nextSpy)
        expect(mockSetDataValue).not.toHaveBeenCalled()
        expect(nextSpy).toHaveBeenCalled()
      })

      it('Should fetch email and name for attending username and update the session values', async () => {
        const req = buildRequest({ user: { providerCode, teamCode, username } })
        await getDefaultUserV2(hmppsAuthClient)(req, res, nextSpy)
        expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCode, teamCode)
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          1,
          req.session.data,
          ['appointments', crn, uuid, 'user', 'email'],
          userProviders.defaultUserDetails?.email,
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          2,
          req.session.data,
          ['appointments', crn, uuid, 'user', 'name'],
          userProviders.defaultUserDetails?.name,
        )
        expect(nextSpy).toHaveBeenCalled()
      })
    })
  })
})
