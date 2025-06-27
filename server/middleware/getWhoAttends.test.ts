import httpMocks from 'node-mocks-http'
import { getWhoAttends } from './getWhoAttends'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const username = 'user-1'

const mockAPIResponse = {
  defaultUserDetails: {
    username: 'peter-parker',
    homeArea: 'London',
    team: 'Automated Allocation Team',
  },
  providers: [
    {
      code: 'N50',
      name: 'Greater Manchester',
    },
    {
      code: 'N07',
      name: 'London',
    },
    {
      code: 'N54',
      name: 'North East Region',
    },
  ],
  teams: [
    {
      description: 'A P Central Admissions Unit',
      code: 'N50CAU',
    },
    {
      description: 'Ascot House Approved Premises',
      code: 'N50AHA',
    },
    {
      description: 'Atherton Court',
      code: 'N50ACT',
    },
  ],
  users: [
    {
      username: 'peter-parker',
      name: 'peter parker (PS-PSO)',
    },
    {
      username: 'jon-smith',
      name: 'jon smith (PS-PSO)',
    },
  ],
} as any

const session = {
  defaultUserDetails: {
    username: 'peter-parker',
    homeArea: 'London',
    team: 'Automated Allocation Team',
  },
  providers: [
    {
      code: 'N50',
      name: 'Greater Manchester',
    },
    {
      code: 'N07',
      name: 'London',
      selected: 'selected',
    },
    {
      code: 'N54',
      name: 'North East Region',
    },
  ],
  teams: [
    {
      description: 'A P Central Admissions Unit',
      code: 'N50CAU',
    },
    {
      description: 'Ascot House Approved Premises',
      code: 'N50AHA',
    },
    {
      description: 'Atherton Court',
      code: 'N50ACT',
    },
  ],
  users: [
    {
      username: 'peter-parker',
      name: 'peter parker (PS-PSO)',
    },
    {
      username: 'jon-smith',
      name: 'jon smith (PS-PSO)',
    },
  ],
} as any

const res = {
  locals: {
    user: {
      username,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

describe('/middleware/getWhoAttends()', () => {
  const nextSpy = jest.fn()

  const spy = jest
    .spyOn(MasApiClient.prototype, 'getUserProviders')
    .mockImplementation(() => Promise.resolve(mockAPIResponse))

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('If current user providers do not exist in session', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          providers: {
            'user-2': mockAPIResponse.providers,
          },
        },
      },
    })
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should fetch the user providers from the api and assign to session', () => {
      expect(spy).toHaveBeenCalledWith(username, undefined, undefined)
      expect(req.session.data.providers).toEqual({
        ...req.session.data.providers,
        [username]: session.providers,
      })
    })
    it('should assign the user providers to res.locals', () => {
      expect(res.locals.userProviders).toEqual(session.providers)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
  describe('If current user providers exists in session', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          providers: {
            [username]: mockAPIResponse.providers,
          },
        },
      },
    })
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should fetch the user providers from the api and assign to session', () => {
      expect(spy).toHaveBeenCalledWith(username, undefined, undefined)
      expect(req.session.data.providers).toEqual({
        ...req.session.data.providers,
        [username]: session.providers,
      })
    })
    it('should assign the existing session user providers to res.locals', () => {
      expect(res.locals.userProviders).toEqual(req.session.data.providers[username])
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
