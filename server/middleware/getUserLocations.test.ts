import httpMocks from 'node-mocks-http'
import { getUserLocations } from './getUserLocations'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const username = 'user-1'

const mockLocationsResponse = {
  name: {
    forename: 'Eula',
    middleName: '',
    surname: 'Schmeler',
  },
  locations: [
    {
      id: 1234,
      description: 'HMP Wakefield',
      address: {
        buildingNumber: '5',
        streetName: 'Love Lane',
        town: 'Wakefield',
        county: 'West Yorkshire',
        postcode: 'WF2 9AG',
      },
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

describe('/middleware/getUserLocations()', () => {
  const nextSpy = jest.fn()

  const spy = jest
    .spyOn(MasApiClient.prototype, 'getUserLocations')
    .mockImplementation(() => Promise.resolve(mockLocationsResponse))

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('If current user locations do not exist in session', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          locations: {
            'user-2': mockLocationsResponse.locations,
          },
        },
      },
    })
    beforeEach(async () => {
      await getUserLocations(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should fetch the user locations from the api and assign to session', () => {
      expect(spy).toHaveBeenCalledWith(username)
      expect(req.session.data.locations).toEqual({
        ...req.session.data.locations,
        [username]: mockLocationsResponse.locations,
      })
    })
    it('should assign the user locations to res.locals', () => {
      expect(res.locals.userLocations).toEqual(mockLocationsResponse.locations)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
  describe('If current user locations exists in session', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          locations: {
            [username]: mockLocationsResponse.locations,
          },
        },
      },
    })
    beforeEach(async () => {
      await getUserLocations(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not fetch the user locations from the api', () => {
      expect(spy).not.toHaveBeenCalled()
    })
    it('should assign the existing session user locations to res.locals', () => {
      expect(res.locals.userLocations).toEqual(req.session.data.locations[username])
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
