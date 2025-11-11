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
import { setDataValue } from '../utils'
import { getUserOptions } from './getUserOptions'
import { UserProviders } from '../data/model/caseload'

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

const getTeamsByProviderSpy = jest
  .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
  .mockImplementation(() => Promise.resolve(appointmentTeams))

const getStaffByTeamSpy = jest
  .spyOn(MasApiClient.prototype, 'getStaffByTeam')
  .mockImplementation(() => Promise.resolve(appointmentStaff))

const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(probationPractitioner))

describe('/middleware/getUserOptions()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should request the user providers from the api', async () => {
    const req = buildRequest()
    await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    expect(getUserProvidersSpy).toHaveBeenCalledWith(username)
  })
  it('should request the user teams from the api', async () => {
    const req = buildRequest()
    await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
  })
  it('should request the user staff from the api', async () => {
    const req = buildRequest()
    await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    expect(getStaffByTeamSpy).toHaveBeenCalledWith(teamCode)
  })

  it('should request the allocated probation practitioner from the api', async () => {
    const req = buildRequest()
    await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
  })

  describe('provider code only in req.query', () => {
    const req = buildRequest({
      query: { providerCode },
      data: {
        providers: { [username]: [...userProviders.providers] },
        teams: { [username]: [...userProviders.teams] },
        staff: { [username]: [...userProviders.users] },
      },
    })
    const sessionProviders = req.session.data.providers[username]
    const sessionTeams = req.session.data.teams[username]
    const sessionStaff = req.session.data.staff[username]

    describe('practitioner is allocated', () => {
      beforeEach(async () => {
        await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
      })
      describe('practitioner is in user provider, staff and teams list', () => {
        it('should not update the providers session', () => {
          expect(req.session.data.providers[username]).toStrictEqual(sessionProviders)
        })
        it('should not update the teams session', () => {
          expect(req.session.data.teams[username]).toStrictEqual(sessionTeams)
        })
        it('should not update the session staff', () => {
          expect(req.session.data.staff[username]).toStrictEqual(sessionStaff)
        })
      })
    })

    describe('practitioner is allocated', () => {
      describe('practitioner is not in provider, staff and teams list', () => {
        const providers = [...userProviders.providers.slice(0, 2)]
        const teams = [...userProviders.teams.slice(0, 1), ...userProviders.teams.slice(2)]
        const users = [...userProviders.users.slice(0, 2)]

        const mockReq = buildRequest({
          query: { providerCode: probationPractitioner.provider.code },
          data: {
            providers: { [username]: providers },
            teams: { [username]: teams },
            staff: { [username]: users },
          },
        })

        const mock: UserProviders = {
          ...userProviders,
          providers,
          teams,
          users,
        }

        beforeEach(async () => {
          jest.spyOn(MasApiClient.prototype, 'getUserProviders').mockImplementationOnce(() => Promise.resolve(mock))
          jest
            .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
            .mockImplementationOnce(() => Promise.resolve({ teams: [...appointmentTeams.teams.slice(1)] }))

          jest
            .spyOn(MasApiClient.prototype, 'getStaffByTeam')
            .mockImplementationOnce(() => Promise.resolve({ users: [...appointmentStaff.users.slice(0, 2)] }))
          await getUserOptions(hmppsAuthClient)(mockReq, res, nextSpy)
        })
        it('should add the practitioner to the providers session', () => {
          expect(mockReq.session.data.providers[username]).toEqual(
            expect.arrayContaining([...mock.providers, probationPractitioner.provider]),
          )
        })
        it('should add the practitioner to the teams session', () => {
          expect(mockReq.session.data.teams[username]).toEqual(
            expect.arrayContaining([...mock.teams, probationPractitioner.team]),
          )
        })
        it('should add the practitioner to the session staff', () => {
          expect(mockReq.session.data.staff[username]).toEqual(
            expect.arrayContaining([
              ...mock.users,
              {
                staffCode: probationPractitioner.code,
                username: probationPractitioner.username,
                nameAndRole: `${probationPractitioner.name.forename} ${probationPractitioner.name.surname}`,
              },
            ]),
          )
        })
      })
    })

    describe('practitioner is allocated', () => {
      describe('user does not have access to the practitioner provider', () => {
        const mockReq = buildRequest({
          query: { providerCode: probationPractitioner.provider.code },
        })
        const mock: UserProviders = {
          ...userProviders,
          providers: [userProviders.providers[0], userProviders.providers[2]],
          teams: [...userProviders.teams.slice(0, 1), ...userProviders.teams.slice(2)],
          users: [...userProviders.users.slice(1)],
        }
        beforeEach(async () => {
          jest.spyOn(MasApiClient.prototype, 'getUserProviders').mockImplementationOnce(() => Promise.resolve(mock))
          await getUserOptions(hmppsAuthClient)(mockReq, res, nextSpy)
        })
        it('should include only practitioner team and user in options', () => {
          const {
            code: staffCode,
            username: ppUsername,
            name: { forename, surname },
          } = probationPractitioner
          expect(res.locals.userTeams).toStrictEqual([{ ...probationPractitioner.team, selected: 'selected' }])
          expect(res.locals.userStaff).toStrictEqual([
            { staffCode, username: ppUsername, nameAndRole: `${forename} ${surname}`, selected: 'selected' },
          ])
        })
      })
      describe('user has access to the practitioner provider', () => {
        const providers = [...userProviders.providers.slice(0, 2)]
        const teams = [...userProviders.teams.slice(1)]
        const users = [...userProviders.users.slice(0, 2)]

        const mockReq = buildRequest({
          user: {
            providerCode: probationPractitioner.provider.code,
            teamCode: probationPractitioner.team.code,
            username: probationPractitioner.username,
          },
          data: {
            providers: { [username]: providers },
            teams: { [username]: teams },
            staff: { [username]: users },
          },
        })
        const mock: UserProviders = {
          ...userProviders,
          providers,
          teams,
          users,
        }
        beforeEach(async () => {
          jest.spyOn(MasApiClient.prototype, 'getUserProviders').mockImplementationOnce(() => Promise.resolve(mock))
          jest
            .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
            .mockImplementationOnce(() => Promise.resolve({ teams: [...appointmentTeams.teams.slice(1)] }))

          jest
            .spyOn(MasApiClient.prototype, 'getStaffByTeam')
            .mockImplementationOnce(() => Promise.resolve({ users: [...appointmentStaff.users.slice(0, 2)] }))
          await getUserOptions(hmppsAuthClient)(mockReq, res, nextSpy)
        })
        it('should include all team and user options', () => {
          const {
            code: staffCode,
            username: ppUsername,
            name: { forename, surname },
          } = probationPractitioner

          expect(res.locals.userTeams).toEqual(
            expect.arrayContaining([...teams, { ...probationPractitioner.team, selected: 'selected' }]),
          )
          expect(res.locals.userStaff).toEqual(
            expect.arrayContaining([
              ...users,
              { staffCode, username: ppUsername, nameAndRole: `${forename} ${surname}`, selected: 'selected' },
            ]),
          )
        })
      })
    })
  })
})
