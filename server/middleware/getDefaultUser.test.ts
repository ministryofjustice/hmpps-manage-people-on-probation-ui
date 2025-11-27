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
import { Provider, Team, User } from '../data/model/caseload'

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
const defaultUserProviderCode = 'N54'
const defaultUserTeamCode = 'N07CHT'

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

  it('should request user providers and allocated probation practitioner from api', async () => {
    const req = buildRequest()
    await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
    expect(getUserProvidersSpy).toHaveBeenCalledWith(username)
    expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
  })

  describe('Attending user does not exist in session', () => {
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })
    const { data } = req.session
    describe('Probation practitioner is allocated', () => {
      describe('Probation practitioner region, team and user does not exist in logged in user providers', () => {
        const mock = {
          ...userProviders,
          providers: [...userProviders.providers.slice(0, 1), ...userProviders.providers.slice(2)],
          teams: [...userProviders.teams.slice(1)],
          users: [...userProviders.users.slice(0, 2)],
        }
        beforeEach(async () => {
          jest.spyOn(MasApiClient.prototype, 'getUserProviders').mockImplementationOnce(() => Promise.resolve(mock))
          await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should save the correct session values **', () => {
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
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            4,
            data,
            ['providers', username],
            [...mock.providers, probationPractitioner.provider],
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            5,
            data,
            ['teams', username],
            [...mock.teams, probationPractitioner.team].sort((a, b) =>
              a.description.localeCompare(b.description, undefined, { sensitivity: 'base' }),
            ),
          )
          expect(mockSetDataValue).toHaveBeenNthCalledWith(
            6,
            req.session.data,
            ['staff', username],
            [
              ...mock.users,
              {
                staffCode: probationPractitioner.code,
                username: probationPractitioner.username,
                nameAndRole: `${probationPractitioner.name.forename} ${probationPractitioner.name.surname} (PS - Other)`,
              },
            ],
          )
          expect(nextSpy).toHaveBeenCalledTimes(1)
        })
      })
      describe('Probation practitioner region, team and user does exist in logged in user providers', () => {
        beforeEach(async () => {
          await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should save the user providers to session', () => {
          expect(mockSetDataValue).toHaveBeenNthCalledWith(4, data, ['providers', username], userProviders.providers)
        })
        it('should save the user teams to session', () => {
          expect(mockSetDataValue).toHaveBeenNthCalledWith(5, data, ['teams', username], userProviders.teams)
        })
        it('should save the user staff to session', () => {
          expect(mockSetDataValue).toHaveBeenNthCalledWith(6, data, ['staff', username], userProviders.users)
        })
      })
    })
  })

  describe('Attending user does not exist in session', () => {
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })
    const { data } = req.session
    describe('Probation practitioner is not allocated', () => {
      const mock: ProbationPractitioner = { ...probationPractitioner, unallocated: true }
      beforeEach(async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
          .mockImplementationOnce(() => Promise.resolve(mock))
        await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
      })
      it('should set the attending user as the default user', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          1,
          data,
          ['appointments', crn, uuid, 'user', 'providerCode'],
          defaultUserProviderCode,
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          2,
          data,
          ['appointments', crn, uuid, 'user', 'teamCode'],
          defaultUserTeamCode,
        )
        expect(mockSetDataValue).toHaveBeenNthCalledWith(
          3,
          data,
          ['appointments', crn, uuid, 'user', 'username'],
          userProviders.defaultUserDetails.username,
        )
        expect(nextSpy).toHaveBeenCalledTimes(1)
      })
      it('should request the teams from the api', () => {
        expect(getTeamsByProviderSpy).toHaveBeenCalledWith(defaultUserProviderCode)
      })
      it('should request the staff from the api', () => {
        expect(getStaffByTeamSpy).toHaveBeenCalledWith(defaultUserTeamCode)
      })
      it('should save the user providers to session', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(4, data, ['providers', username], userProviders.providers)
      })
      it('should save the user teams to session', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(5, data, ['teams', username], userProviders.teams)
      })
      it('should save the user staff to session', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(6, data, ['staff', username], userProviders.users)
      })
    })
  })

  describe('Attending user does exist in session', () => {
    describe('attendee is probation practitioner', () => {
      const req = buildRequest({
        user: {
          providerCode: probationPractitioner.provider.code,
          teamCode: probationPractitioner.team.code,
          username: probationPractitioner.username,
        },
      })
      const { data } = req.session

      describe('Probation practitioner region, team and user does not exist in logged in user providers', () => {
        const mockUserProviders = {
          ...userProviders,
          providers: [...userProviders.providers.slice(0, 1), ...userProviders.providers.slice(2)],
        }
        const mockAppointmentTeams = { teams: [...appointmentTeams.teams.slice(1)] }
        const mockAppointmentStaff = { users: [...appointmentStaff.users.slice(0, 2)] }

        beforeEach(async () => {
          jest
            .spyOn(MasApiClient.prototype, 'getUserProviders')
            .mockImplementationOnce(() => Promise.resolve(mockUserProviders))
          jest
            .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
            .mockImplementationOnce(() => Promise.resolve(mockAppointmentTeams))
          jest
            .spyOn(MasApiClient.prototype, 'getStaffByTeam')
            .mockImplementationOnce(() => Promise.resolve(mockAppointmentStaff))
          await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should save the correct session values :)', () => {
          const expectedProviders = [
            { code: 'N50', name: 'Greater Manchester' },
            { code: 'N54', name: 'North East Region' },
            { code: 'N07', name: 'London' },
          ]
          const expectedTeams = [
            { description: 'Automation SPG', code: 'N07CHT' },
            {
              description: 'Automation Test No Location Warning',
              code: 'N07IVH',
            },
            { description: 'Bexley\\Bromley SP TEST1', code: 'N07SP1' },
            { code: 'N07AAT', description: 'Automated Allocation Team' },
          ]

          const expectedStaff = [
            {
              staffCode: 'N07B722',
              username: 'peter-parker',
              nameAndRole: 'Peter Parker (PS - Other)',
            },
            {
              staffCode: 'N57A054',
              username: 'IainChambers',
              nameAndRole: 'Iain Chambers (PS - Other)',
            },
            {
              staffCode: 'N07B795',
              username: 'DeborahFern',
              nameAndRole: 'Deborah Fern',
            },
          ]

          expect(mockSetDataValue).toHaveBeenNthCalledWith(1, data, ['providers', username], expectedProviders)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(2, data, ['teams', username], expectedTeams)
          expect(mockSetDataValue).toHaveBeenNthCalledWith(3, data, ['staff', username], expectedStaff)
          expect(nextSpy).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  describe('Attending user does exist in session', () => {
    describe('attendee is not probation practitioner', () => {
      const req = buildRequest()
      const { data } = req.session
      const expectedProviders = [
        { code: 'N50', name: 'Greater Manchester' },
        { code: 'N07', name: 'London' },
        { code: 'N54', name: 'North East Region' },
      ]
      const expectedTeams = [
        { description: 'Automated Allocation Team', code: 'N07AAT' },
        { description: 'Automation SPG', code: 'N07CHT' },
        {
          description: 'Automation Test No Location Warning',
          code: 'N07IVH',
        },
        { description: 'Bexley\\Bromley SP TEST1', code: 'N07SP1' },
      ]
      const expectedStaff = [
        {
          staffCode: 'N07B722',
          username: 'peter-parker',
          nameAndRole: 'Peter Parker (PS - Other)',
        },
        {
          staffCode: 'N57A054',
          username: 'IainChambers',
          nameAndRole: 'Iain Chambers (PS - Other)',
        },
        {
          staffCode: 'N07B795',
          username: 'DeborahFern',
          nameAndRole: 'Deborah Fern (PS - Other)',
        },
      ]

      beforeEach(async () => {
        await getDefaultUser(hmppsAuthClient)(req, res, nextSpy)
      })
      it('should request the teams from the api', () => {
        expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
      })
      it('should request the staff from the api', () => {
        expect(getStaffByTeamSpy).toHaveBeenCalledWith(teamCode)
      })
      it('should save the correct session values', () => {
        expect(mockSetDataValue).toHaveBeenNthCalledWith(1, data, ['providers', username], expectedProviders)
        expect(mockSetDataValue).toHaveBeenNthCalledWith(2, data, ['teams', username], expectedTeams)
        expect(mockSetDataValue).toHaveBeenNthCalledWith(3, req.session.data, ['staff', username], expectedStaff)
      })
    })
  })
})
