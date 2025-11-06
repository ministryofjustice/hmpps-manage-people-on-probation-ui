import httpMocks, { RequestMethod } from 'node-mocks-http'
import { getWhoAttends } from './getWhoAttends'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import {
  mockAppResponse,
  probationPractitioner,
  userProviders,
  appointmentTeams,
  appointmentStaff,
} from '../controllers/mocks'
import { ProbationPractitioner } from '../models/CaseDetail'
import { setDataValue } from '../utils'
import { UserProviders } from '../data/model/caseload'
import { AppointmentStaff, AppointmentTeams } from '../data/model/appointment'

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
const username = 'IainChambers'
const providerCode = 'N50'
const teamCode = 'N07IVH'

const res = mockAppResponse({ user: { username } })

const checkOptionsPPSelected = (req: httpMocks.MockRequest<any>, addedUser = false) => {
  it('should create the correct provider options and save to res.locals.userProviders', () => {
    const { providers } = userProviders
    const expected = [providers[0], { ...providers[1], selected: 'selected' }, providers[2]]
    expect(res.locals.userProviders).toEqual(expect.arrayContaining(expected))
  })
  it('should create the correct team options and save to res.locals.userTeams', () => {
    const { teams } = appointmentTeams
    const expected = [{ ...teams[0], selected: 'selected' }, ...teams.slice(1)]
    expect(res.locals.userTeams).toEqual(expect.arrayContaining(expected))
  })
  it('should create the correct user options and save to res.locals.userStaff', () => {
    const { users } = appointmentStaff
    const {
      name: { forename, surname },
    } = probationPractitioner
    const user = addedUser ? { ...users[2], nameAndRole: `${forename} ${surname}` } : users[2]
    const expected = [...users.slice(0, 2), { ...user, selected: 'selected' }]
    expect(res.locals.userStaff).toEqual(expect.arrayContaining(expected))
  })
  it('should set the session user provider code to the practitioner region', () => {
    const { data } = req.session
    expect(mockSetDataValue).toHaveBeenCalledWith(
      data,
      ['appointments', crn, uuid, 'user', 'providerCode'],
      probationPractitioner.provider.code,
    )
  })
  it('should set the session user team code to the practitioner team', () => {
    const { data } = req.session
    expect(mockSetDataValue).toHaveBeenCalledWith(
      data,
      ['appointments', crn, uuid, 'user', 'teamCode'],
      probationPractitioner.team.code,
    )
  })
  it('should set the session username to the practitioner username', () => {
    const { data } = req.session
    expect(mockSetDataValue).toHaveBeenCalledWith(
      data,
      ['appointments', crn, uuid, 'user', 'username'],
      probationPractitioner.username,
    )
  })
}

describe('/middleware/getWhoAttends()', () => {
  const buildRequest = ({
    req = {},
    params = {},
    query = {},
    user = {},
    data = {},
  } = {}): httpMocks.MockRequest<any> => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Request has no user session, case has allocated probation practitioner, no region or team selected', () => {
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the allocated probation practitioner from the api', () => {
      expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    })
    it('should request the user providers from the api', async () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username)
    })
    it('should request teams in probation practitioner region', () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(probationPractitioner.provider.code)
    })
    it('should request users in probation practitioner team', () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(probationPractitioner.team.code)
    })
    it('should set the session user provider code to the practitioner region', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(
        data,
        ['appointments', crn, uuid, 'user', 'providerCode'],
        probationPractitioner.provider.code,
      )
    })
    it('should set the session user team code to the practitioner team', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(
        data,
        ['appointments', crn, uuid, 'user', 'teamCode'],
        probationPractitioner.team.code,
      )
    })
    it('should set the session username to the practitioner username', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(
        data,
        ['appointments', crn, uuid, 'user', 'username'],
        probationPractitioner.username,
      )
    })
    it('should save the regions, teams and users returned from api into the session', () => {
      expect(req.session.data.providers[username]).toEqual(userProviders.providers)
      expect(req.session.data.teams[username]).toEqual(appointmentTeams.teams)
      expect(req.session.data.staff[username]).toEqual(appointmentStaff.users)
    })
    checkOptionsPPSelected(req)
    it('should create the correct attending user value and save to res.locals.attendingUser', () => {
      const {
        code: staffCode,
        username: ppUsername,
        provider: { name: homeArea },
        team: { description: team },
      } = probationPractitioner

      const expected = {
        staffCode,
        username: ppUsername,
        homeArea,
        team,
      }
      expect(res.locals.attendingUser).toStrictEqual(expected)
    })
    it('should save the correct value to res.locals.providerCode', () => {
      expect(res.locals.providerCode).toEqual(probationPractitioner.provider.code)
    })
    it('should save the correct value to res.locals.teamCode', () => {
      expect(res.locals.teamCode).toEqual(probationPractitioner.team.code)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Case has allocated probation practitioner but is not in appointment user options', () => {
    const { teams } = appointmentTeams
    const { users } = appointmentStaff
    const mockTeamsNoPP: AppointmentTeams = { teams: [...teams.slice(1)] }
    const mockUsersNoPP: AppointmentStaff = { users: [...users.slice(0, 2)] }
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })

    beforeEach(async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
        .mockImplementationOnce(() => Promise.resolve(mockTeamsNoPP))
      jest.spyOn(MasApiClient.prototype, 'getStaffByTeam').mockImplementationOnce(() => Promise.resolve(mockUsersNoPP))
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should add probation practitioner region to options', () => {
      expect(req.session.data.providers[username]).toEqual(expect.arrayContaining(userProviders.providers))
    })
    it('should add probation practitioner team to options', () => {
      expect(req.session.data.teams[username]).toEqual(expect.arrayContaining(appointmentTeams.teams))
    })
    it('should add probation practitioner user to options', () => {
      const {
        name: { forename, surname },
      } = probationPractitioner
      const expected = [...users.slice(0, 2), { ...users[2], nameAndRole: `${forename} ${surname}` }]
      expect(req.session.data.staff[username]).toEqual(expected)
    })
    const addedUser = true
    checkOptionsPPSelected(req, addedUser)
  })

  describe('Case has allocated probation practitioner, but practitioner region not selected', () => {
    const { teams } = appointmentTeams
    const { users } = appointmentStaff
    const mockTeamsNoPP: AppointmentTeams = { teams: [...teams.slice(1)] }
    const mockUsersNoPP: AppointmentStaff = { users: [...users.slice(0, 2)] }
    const req = buildRequest({ query: { providerCode } })
    beforeEach(async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getTeamsByProvider')
        .mockImplementationOnce(() => Promise.resolve(mockTeamsNoPP))
      jest.spyOn(MasApiClient.prototype, 'getStaffByTeam').mockImplementationOnce(() => Promise.resolve(mockUsersNoPP))
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not add the practitioner team to options', () => {
      expect(req.session.data.teams[username]).toEqual(mockTeamsNoPP.teams)
    })
    it('should not add practitioner user to options', () => {
      expect(req.session.data.staff[username]).toEqual(mockUsersNoPP.users)
    })
  })

  describe('Practitioner region selected, but the provider code is not in user providers', () => {
    const req = buildRequest({ query: { providerCode: probationPractitioner.provider.code } })
    const mockProvidersNoPPRegion = {
      ...userProviders,
      providers: [userProviders.providers[0], userProviders.providers[2]],
    }
    beforeEach(async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getUserProviders')
        .mockImplementationOnce(() => Promise.resolve(mockProvidersNoPPRegion))
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should only create a single team option for practitioner team', () => {
      expect(res.locals.userTeams).toStrictEqual([{ ...probationPractitioner.team, selected: 'selected' }])
    })
    it('should only create a single user option for practitioner user', () => {
      const {
        username: ppUsername,
        code: staffCode,
        name: { forename, surname },
      } = probationPractitioner
      expect(res.locals.userStaff).toStrictEqual([
        { username: ppUsername, nameAndRole: `${forename} ${surname}`, staffCode, selected: 'selected' },
      ])
    })
  })

  describe('Request has no user session, case has no probation practitioner allocated', () => {
    const req = buildRequest({ user: { providerCode: undefined, teamCode: undefined, username: undefined } })
    const mockPPUnallocated: ProbationPractitioner = {
      ...probationPractitioner,
      unallocated: true,
    }
    beforeEach(async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
        .mockImplementationOnce(() => Promise.resolve(mockPPUnallocated))
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request teams in default user region', () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith('N54')
    })
    it('should request users in default user team', () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith('N07CHT')
    })
    it('should create the correct provider options and save to res.locals.userProviders', () => {
      const { providers } = userProviders
      const expected = [providers[0], providers[1], { ...providers[2], selected: 'selected' }]
      expect(res.locals.userProviders).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct team options and save to res.locals.userTeams', () => {
      const { teams } = appointmentTeams
      const expected = [teams[0], { ...teams[1], selected: 'selected' }, ...teams.slice(2)]
      expect(res.locals.userTeams).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct user options and save to res.locals.userStaff', () => {
      const { users } = appointmentStaff
      const expected = [{ ...users[0], selected: 'selected' }, ...users.slice(1)]
      expect(res.locals.userStaff).toEqual(expect.arrayContaining(expected))
    })
    it('should set the session user provider code to the default user region', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(data, ['appointments', crn, uuid, 'user', 'providerCode'], 'N54')
    })
    it('should set the session user team code to the default user team', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(data, ['appointments', crn, uuid, 'user', 'teamCode'], 'N07CHT')
    })
    it('should set the session username to the default username', () => {
      const { data } = req.session
      expect(mockSetDataValue).toHaveBeenCalledWith(
        data,
        ['appointments', crn, uuid, 'user', 'username'],
        'peter-parker',
      )
    })
    it('should create the correct attending user value and save to res.locals.attendingUser', () => {
      const { homeArea, team } = userProviders.defaultUserDetails
      const expected = {
        staffCode: 'N07B722',
        username: 'peter-parker',
        homeArea,
        team,
      }
      expect(res.locals.attendingUser).toStrictEqual(expected)
    })
    it('should save the correct value to res.locals.providerCode', () => {
      expect(res.locals.providerCode).toEqual('N54')
    })
    it('should save the correct value to res.locals.teamCode', () => {
      expect(res.locals.teamCode).toEqual('N07CHT')
    })
  })

  describe('Request has attending user in session', () => {
    const req = buildRequest()
    const { providerCode: sessionProviderCode, teamCode: sessionTeamCode } =
      req.session.data.appointments[crn][uuid].user
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request teams by provider code session value', () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(sessionProviderCode)
    })
    it('should request users by team code session value', () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(sessionTeamCode)
    })
    it('should create the correct provider options and save to res.locals.userProviders', () => {
      const { providers } = userProviders
      const expected = [{ ...providers[0], selected: 'selected' }, providers[1], providers[2]]
      expect(res.locals.userProviders).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct team options and save to res.locals.userTeams', () => {
      const { teams } = appointmentTeams
      const expected = [teams[0], teams[1], { ...teams[2], selected: 'selected' }, teams[3]]
      expect(res.locals.userTeams).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct user options and save to res.locals.userStaff', () => {
      const { users } = appointmentStaff
      const expected = [users[0], { ...users[1], selected: 'selected' }, users[2]]
      expect(res.locals.userStaff).toEqual(expect.arrayContaining(expected))
    })
    it('should set the session user provider code to the default user region', () => {
      const { data } = req.session
      expect(mockSetDataValue).not.toHaveBeenCalledWith(
        data,
        ['appointments', crn, uuid, 'user', 'providerCode'],
        providerCode,
      )
    })
    it('should set the session user team code to the default user team', () => {
      const { data } = req.session
      expect(mockSetDataValue).not.toHaveBeenCalledWith(data, ['appointments', crn, uuid, 'user', 'teamCode'], teamCode)
    })
    it('should set the session username to the default username', () => {
      const { data } = req.session
      expect(mockSetDataValue).not.toHaveBeenCalledWith(data, ['appointments', crn, uuid, 'user', 'username'], username)
    })
    it('should create the correct attending user value and save to res.locals.attendingUser', () => {
      const expected = {
        staffCode: 'N57A054',
        username,
        homeArea: 'Greater Manchester',
        team: 'Automation Test No Location Warning',
      }
      expect(res.locals.attendingUser).toStrictEqual(expected)
    })
    it('should save the correct value to res.locals.providerCode', () => {
      expect(res.locals.providerCode).toEqual(providerCode)
    })
    it('should save the correct value to res.locals.teamCode', () => {
      expect(res.locals.teamCode).toEqual(teamCode)
    })
  })

  describe('Region selection is in url query string', () => {
    const req = buildRequest({ query: { providerCode } })
    const { teams } = appointmentTeams
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request teams by provider code in query string', () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
    })
    it('should request users by first user team code', () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(teams[0].code)
    })
    it('should create the correct provider options and save to res.locals.userProviders', () => {
      const { providers } = userProviders
      const expected = [{ ...providers[0], selected: 'selected' }, providers[1], providers[2]]
      expect(res.locals.userProviders).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct team options and save to res.locals.userTeams', () => {
      const expected = [{ ...teams[0], selected: 'selected' }, teams[1], teams[2], teams[3]]
      expect(res.locals.userTeams).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct user options and save to res.locals.userStaff', () => {
      const { users } = appointmentStaff
      const expected = [{ ...users[0], selected: 'selected' }, users[1], users[2]]
      expect(res.locals.userStaff).toEqual(expect.arrayContaining(expected))
    })
    it('should save the correct value to res.locals.providerCode', () => {
      expect(res.locals.providerCode).toEqual(providerCode)
    })
    it('should save the correct value to res.locals.teamCode', () => {
      expect(res.locals.teamCode).toEqual(teams[0].code)
    })
  })

  describe('Region and team selection is in url query string', () => {
    const req = buildRequest({ query: { providerCode, teamCode } })
    const { teams } = appointmentTeams
    beforeEach(async () => {
      await getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request teams by provider code in query string', () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
    })
    it('should request users by team code in query string', () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(teamCode)
    })
    it('should create the correct provider options and save to res.locals.userProviders', () => {
      const { providers } = userProviders
      const expected = [{ ...providers[0], selected: 'selected' }, providers[1], providers[2]]
      expect(res.locals.userProviders).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct team options and save to res.locals.userTeams', () => {
      const expected = [teams[0], teams[1], { ...teams[2], selected: 'selected' }, teams[3]]
      expect(res.locals.userTeams).toEqual(expect.arrayContaining(expected))
    })
    it('should create the correct user options and save to res.locals.userStaff', () => {
      const { users } = appointmentStaff
      const expected = [{ ...users[0], selected: 'selected' }, users[1], users[2]]
      expect(res.locals.userStaff).toEqual(expect.arrayContaining(expected))
    })
    it('should save the correct value to res.locals.providerCode', () => {
      expect(res.locals.providerCode).toEqual(providerCode)
    })
    it('should save the correct value to res.locals.teamCode', () => {
      expect(res.locals.teamCode).toEqual(teamCode)
    })
  })
})
