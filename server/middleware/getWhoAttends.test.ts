import httpMocks from 'node-mocks-http'
import { getWhoAttends } from './getWhoAttends'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import { UserProviders } from '../data/model/caseload'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const username = 'user-1'

const unmatchedUserDetails = {
  username: 'wrong',
  homeArea: 'wrong',
  team: 'wrong',
}
const matchedUserDetails = {
  username: 'PETER-PARKER',
  homeArea: 'London',
  team: 'Ascot House Approved Premises',
}

const rest = {
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
}

const mockAPIResponse = {
  ...rest,
  defaultUserDetails: matchedUserDetails,
} as any
const mockAPIResponseUnmatched = {
  ...rest,
  defaultUserDetails: unmatchedUserDetails,
} as any

const expectedSession = {
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
    .mockImplementation((user, regionCode, teamCode): Promise<UserProviders> => {
      if (user === 'user-1') {
        return Promise.resolve(mockAPIResponse)
      }
      return Promise.resolve(mockAPIResponseUnmatched)
    })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('If defaults do not match userProviders ', () => {
    const mockRes = {
      locals: {
        user: {
          username: 'not',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse
    const req = httpMocks.createRequest({
      session: {
        data: {
          providers: {
            'user-1': mockAPIResponse.providers,
          },
        },
      },
    })
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, mockRes, nextSpy)
    })
    it('should fetch the user providers from the api and assign to session', () => {
      expect(spy).toHaveBeenCalledWith('not', undefined, undefined)
      expect(req.session.data.providers).toEqual({
        ...req.session.data.providers,
      })
    })
    it('should assign the user providers to res.locals', () => {
      expect(res.locals.userProviders).toEqual(undefined)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
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
        [username]: expectedSession.providers,
      })
    })
    it('should assign the user providers to res.locals', () => {
      expect(res.locals.userProviders).toEqual(req.session.data.providers[username])
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
        [username]: expectedSession.providers,
      })
    })
    it('should assign the existing session user providers to res.locals', () => {
      expect(res.locals.userProviders).toEqual(req.session.data.providers[username])
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('back link selected', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          providers: {
            [username]: mockAPIResponse.providers,
          },
        },
      },
      query: {
        back: 'attendance',
      },
    })
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should fetch the user providers from session', () => {
      expect(spy).toHaveBeenCalledWith(username, undefined, undefined)
      expect(req.session.data.providers).toEqual({
        ...req.session.data.providers,
        [username]: mockAPIResponse.providers,
      })
    })
  })
})
