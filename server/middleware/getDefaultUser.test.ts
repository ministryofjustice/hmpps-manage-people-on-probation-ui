import httpMocks, { RequestMethod } from 'node-mocks-http'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import {
  appointmentStaff,
  appointmentTeams,
  mockAppResponse,
  probationPractitioner,
  userProviders,
} from '../controllers/mocks'
import { ProbationPractitioner } from '../models/CaseDetail'
import { setDataValue } from '../utils'
import { getDefaultUser } from './getDefaultUser'

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
                providerCode,
                teamCode,
                username,
                ...user,
              },
            },
          },
        },
        ...data,
      },
    },
    ...req,
  }
  return httpMocks.createRequest(request)
}

const res = mockAppResponse({ user: { username } })

const getUserProvidersSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserProviders')
  .mockImplementation(() => Promise.resolve(userProviders))

const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(probationPractitioner))

const getTeamsByProviderSpy = jest
  .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
  .mockImplementation(() => Promise.resolve(appointmentTeams))

const getStaffByTeamSpy = jest
  .spyOn(MasApiClient.prototype, 'getStaffByTeam')
  .mockImplementation(() => Promise.resolve(appointmentStaff))

describe('/middleware/getDefaultUser()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Attending user does not exist in appointment session', () => {
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })
    const { data } = req.session
    describe('Probation practitioner is allocated', () => {
      describe('Practitioner exists in user providers staff', () => {
        beforeEach(async () => {
          await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should request user providers from api', () => {
          expect(getUserProvidersSpy).toHaveBeenCalledWith(username)
        })
        it('should request allocated probation practitioner from api', () => {
          expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
        })
        it('should request the provider teams from the api', () => {
          expect(getTeamsByProviderSpy).toHaveBeenCalledWith(probationPractitioner.provider.code)
        })
        it('should request the provider users from the api', () => {
          expect(getStaffByTeamSpy).toHaveBeenCalledWith(probationPractitioner.team.code)
        })
        it('should set the practitioner as the default user', () => {
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            1,
            data,
            ['appointments', crn, uuid, 'user', 'providerCode'],
            probationPractitioner.provider.code,
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            2,
            data,
            ['appointments', crn, uuid, 'user', 'teamCode'],
            probationPractitioner.team.code,
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            3,
            data,
            ['appointments', crn, uuid, 'user', 'username'],
            probationPractitioner.username,
          )

          expect(mockSetDataValue).toHaveBeenNthCalledWith(4, data, ['providers', username], userProviders.providers)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(5, data, ['teams', username], appointmentTeams.teams)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(6, data, ['staff', username], appointmentStaff.users)
        })
        it('should call next()', () => {
          expect(nextSpy).toHaveBeenCalledTimes(1)
        })
      })

      describe('Practitioner does not exist in user providers staff', () => {
        const mock = { ...userProviders, users: [userProviders.users[0], userProviders.users[1]] }
        beforeEach(async () => {
          jest.spyOn(MasApiClient.prototype, 'getUserProviders').mockImplementationOnce(() => Promise.resolve(mock))
          await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should set the default user as the practitioner', () => {
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            1,
            data,
            ['appointments', crn, uuid, 'user', 'providerCode'],
            probationPractitioner.provider.code,
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            2,
            data,
            ['appointments', crn, uuid, 'user', 'teamCode'],
            probationPractitioner.team.code,
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            3,
            data,
            ['appointments', crn, uuid, 'user', 'username'],
            probationPractitioner.username,
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(4, data, ['providers', username], userProviders.providers)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(5, data, ['teams', username], appointmentTeams.teams)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(6, data, ['staff', username], appointmentStaff.users)
        })
      })
    })

    describe('Probation practitioner is not allocated', () => {
      const mock: ProbationPractitioner = { ...probationPractitioner, unallocated: true }
      beforeEach(async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
          .mockImplementationOnce(() => Promise.resolve(mock))
        await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
      })
      it('should request the provider teams from the api', () => {
        expect(getTeamsByProviderSpy).toHaveBeenCalledWith('N54')
      })
      it('should request the provider users from the api', () => {
        expect(getStaffByTeamSpy).toHaveBeenCalledWith('N07CHT')
      })
      it('should set the default user', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          1,
          data,
          ['appointments', crn, uuid, 'user', 'providerCode'],
          'N54',
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          2,
          data,
          ['appointments', crn, uuid, 'user', 'teamCode'],
          'N07CHT',
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          3,
          data,
          ['appointments', crn, uuid, 'user', 'username'],
          userProviders.defaultUserDetails.username,
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(4, data, ['providers', username], userProviders.providers)
        expect(mockSetDataValue).toHaveBeenNthCalledWith(5, data, ['teams', username], userProviders.teams)
        expect(mockSetDataValue).toHaveBeenNthCalledWith(6, data, ['staff', username], userProviders.users)
      })
    })
  })

  describe('Attending user exists in appointment session', () => {
    const req = buildRequest()
    beforeEach(async () => {
      await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not set any session values', () => {
      expect(mockSetDataValue).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
