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
import { getUserOptions } from './getUserOptions'

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

const crn = 'X000001'
const uuid = 'a4615940-2808-4ab5-a8e0-feddecb8ae1a'
const loggedInUsername = 'user-1'
const providerCode = 'N50'
const teamCode = 'N07IVH'
const username = 'IainChambers'
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
        ...data,
      },
    },
    ...req,
  }
  return httpMocks.createRequest(request)
}

const checkDefaultUserSelection = () => {
  it('should request the providers for the logged in user from the api', async () => {
    expect(getUserProvidersSpy).toHaveBeenCalledWith(loggedInUsername)
  })
  it('should request the user teams from the api by the default user provider code', async () => {
    expect(getTeamsByProviderSpy).toHaveBeenCalledWith(defaultUserProviderCode)
  })
  it('should request the user staff from the api by default user team code', async () => {
    expect(getStaffByTeamSpy).toHaveBeenCalledWith(defaultUserTeamCode)
  })
  it('should create the correct provider options', () => {
    expect(res.locals.userProviders).toStrictEqual([
      ...userProviders.providers.slice(0, 2),
      { ...userProviders.providers[2], selected: 'selected' },
    ])
  })
  it('should create the correct team options', () => {
    expect(res.locals.userTeams).toStrictEqual([
      ...appointmentTeams.teams.slice(0, 1),
      { ...appointmentTeams.teams[1], selected: 'selected' },
      ...appointmentTeams.teams.slice(2),
    ])
  })
  it('should create the correct user options', () => {
    expect(res.locals.userStaff).toStrictEqual([
      { ...appointmentStaff.users[0], selected: 'selected' },
      ...appointmentStaff.users.slice(1),
    ])
  })
  it('should set res.locals.providerCode as the default user provider', () => {
    expect(res.locals.providerCode).toEqual(defaultUserProviderCode)
  })
  it('should set res.locals.teamCode as the default user team', () => {
    expect(res.locals.teamCode).toEqual(defaultUserTeamCode)
  })
  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
}

const res = mockAppResponse({ user: { username: loggedInUsername } })

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

  describe('Attending user is in session and not probation practitioner', () => {
    const req = buildRequest()
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the providers for the logged in user from the api', async () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(loggedInUsername)
    })
    it('should request the user teams from the api', async () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
    })
    it('should request the user staff from the api', async () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(teamCode)
    })
    it('should request the allocated probation practitioner from the api', () => {
      expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    })
    it('should create the correct provider options', () => {
      expect(res.locals.userProviders).toStrictEqual([
        { ...userProviders.providers[0], selected: 'selected' },
        ...userProviders.providers.slice(1),
      ])
    })
    it('should create the correct team options', () => {
      expect(res.locals.userTeams).toStrictEqual([
        ...appointmentTeams.teams.slice(0, 2),
        { ...appointmentTeams.teams[2], selected: 'selected' },
        appointmentTeams.teams[3],
      ])
    })
    it('should create the correct user options', () => {
      expect(res.locals.userStaff).toStrictEqual([
        appointmentStaff.users[0],
        { ...appointmentStaff.users[1], selected: 'selected' },
        appointmentStaff.users[2],
      ])
    })
    it('should set res.locals.providerCode as the session user provider', () => {
      expect(res.locals.providerCode).toEqual(req.session.data.appointments[crn][uuid].user.providerCode)
    })
    it('should set res.locals.teamCode as the session user team', () => {
      expect(res.locals.teamCode).toEqual(req.session.data.appointments[crn][uuid].user.teamCode)
    })
  })
  describe('Attending user is in session and is probation practitioner', () => {
    const req = buildRequest({
      user: {
        providerCode: probationPractitioner.provider.code,
        teamCode: probationPractitioner.team.code,
        username: probationPractitioner.username,
      },
    })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    checkDefaultUserSelection()
  })

  describe('Attending user is in session and is the default user', () => {
    const req = buildRequest({
      user: {
        providerCode: defaultUserProviderCode,
        teamCode: defaultUserTeamCode,
        username: userProviders.defaultUserDetails.username,
      },
    })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    checkDefaultUserSelection()
  })

  describe('No attending user session or request url query', () => {
    const req = buildRequest({
      user: {
        providerCode: undefined,
        teamCode: undefined,
        username: undefined,
      },
    })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    checkDefaultUserSelection()
  })

  describe('Provider code is in request url query', () => {
    const req = buildRequest({
      user: {
        providerCode: undefined,
        teamCode: undefined,
        username: undefined,
      },
      query: {
        providerCode,
      },
    })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the providers for the logged in user from the api', async () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(loggedInUsername)
    })
    it('should request the user teams from the api', async () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
    })
    it('should request the user staff from the api', async () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(appointmentTeams.teams[0].code)
    })
    it('should request the allocated probation practitioner from the api', () => {
      expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    })
    it('should create the correct provider options', () => {
      expect(res.locals.userProviders).toStrictEqual([
        { ...userProviders.providers[0], selected: 'selected' },
        ...userProviders.providers.slice(1),
      ])
    })
    it('should create the correct team options', () => {
      expect(res.locals.userTeams).toStrictEqual([
        { ...appointmentTeams.teams[0], selected: 'selected' },
        ...appointmentTeams.teams.slice(1),
      ])
    })
    it('should create the correct user options', () => {
      expect(res.locals.userStaff).toStrictEqual([
        { ...appointmentStaff.users[0], selected: 'selected' },
        ...appointmentStaff.users.slice(1),
      ])
    })
    it('should set res.locals.providerCode as the provider code in the request url query', () => {
      expect(res.locals.providerCode).toEqual(providerCode)
    })
    it('should set res.locals.teamCode as the first team', () => {
      expect(res.locals.teamCode).toEqual(appointmentTeams.teams[0].code)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Provider and team code are in request url query', () => {
    const req = buildRequest({
      user: {
        providerCode: undefined,
        teamCode: undefined,
        username: undefined,
      },
      query: {
        providerCode,
        teamCode,
      },
    })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the providers for the logged in user from the api', async () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(loggedInUsername)
    })
    it('should request the user teams from the api', async () => {
      expect(getTeamsByProviderSpy).toHaveBeenCalledWith(providerCode)
    })
    it('should request the user staff from the api', async () => {
      expect(getStaffByTeamSpy).toHaveBeenCalledWith(teamCode)
    })
    it('should request the allocated probation practitioner from the api', () => {
      expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    })
    it('should create the correct provider options', () => {
      expect(res.locals.userProviders).toStrictEqual([
        { ...userProviders.providers[0], selected: 'selected' },
        ...userProviders.providers.slice(1),
      ])
    })
    it('should create the correct team options', () => {
      expect(res.locals.userTeams).toStrictEqual([
        ...appointmentTeams.teams.slice(0, 2),
        { ...appointmentTeams.teams[2], selected: 'selected' },
        appointmentTeams.teams[3],
      ])
    })
    it('should create the correct user options', () => {
      expect(res.locals.userStaff).toStrictEqual([
        { ...appointmentStaff.users[0], selected: 'selected' },
        ...appointmentStaff.users.slice(1),
      ])
    })
    it('should set res.locals.providerCode as the provider code in the request url query', () => {
      expect(res.locals.providerCode).toEqual(providerCode)
    })
    it('should set res.locals.teamCode as the team code in the request url query', () => {
      expect(res.locals.teamCode).toEqual(teamCode)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
