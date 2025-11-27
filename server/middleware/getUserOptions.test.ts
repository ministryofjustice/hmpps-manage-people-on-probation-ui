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
import { setDataValue } from '../utils'

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
    const expectedProviderOptions = [
      { code: 'N50', name: 'Greater Manchester' },
      { code: 'N07', name: 'London' },
      { code: 'N54', name: 'North East Region', selected: 'selected' },
    ]
    expect(res.locals.userProviders).toStrictEqual(expectedProviderOptions)
  })
  it('should create the correct team options', () => {
    const expectedTeamOptions = [
      { code: 'N07AAT', description: 'Automated Allocation Team' },
      {
        code: 'N07CHT',
        description: 'Automation SPG',
        selected: 'selected',
      },
      {
        code: 'N07IVH',
        description: 'Automation Test No Location Warning',
      },
      { code: 'N07SP1', description: 'Bexley\\Bromley SP TEST1' },
    ]
    expect(res.locals.userTeams).toStrictEqual(expectedTeamOptions)
  })
  it('should create the correct user options', () => {
    const expectedUserOptions = [
      {
        username: 'DeborahFern',
        nameAndRole: 'Deborah Fern (PS - Other)',
        staffCode: 'N07B795',
      },
      {
        username: 'IainChambers',
        nameAndRole: 'Iain Chambers (PS - Other)',
        staffCode: 'N57A054',
      },
      {
        username: 'peter-parker',
        nameAndRole: 'Peter Parker (PS - Other)',
        staffCode: 'N07B722',
        selected: 'selected',
      },
    ]
    expect(res.locals.userStaff).toStrictEqual(expectedUserOptions)
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
      const expectedProviderOptions = [
        { code: 'N50', name: 'Greater Manchester', selected: 'selected' },
        { code: 'N07', name: 'London' },
        { code: 'N54', name: 'North East Region' },
      ]
      expect(res.locals.userProviders).toStrictEqual(expectedProviderOptions)
    })
    it('should create the correct team options', () => {
      const expectedTeamOptions = [
        { code: 'N07AAT', description: 'Automated Allocation Team' },
        { code: 'N07CHT', description: 'Automation SPG' },
        {
          code: 'N07IVH',
          description: 'Automation Test No Location Warning',
          selected: 'selected',
        },
        { code: 'N07SP1', description: 'Bexley\\Bromley SP TEST1' },
      ]
      expect(res.locals.userTeams).toStrictEqual(expectedTeamOptions)
    })
    it('should create the correct user options', () => {
      const expectedUserOptions = [
        {
          username: 'DeborahFern',
          nameAndRole: 'Deborah Fern (PS - Other)',
          staffCode: 'N07B795',
        },
        {
          username: 'IainChambers',
          nameAndRole: 'Iain Chambers (PS - Other)',
          staffCode: 'N57A054',
          selected: 'selected',
        },
        {
          username: 'peter-parker',
          nameAndRole: 'Peter Parker (PS - Other)',
          staffCode: 'N07B722',
        },
      ]
      expect(res.locals.userStaff).toStrictEqual(expectedUserOptions)
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
      const expectedProviderOptions = [
        { code: 'N50', name: 'Greater Manchester', selected: 'selected' },
        { code: 'N07', name: 'London' },
        { code: 'N54', name: 'North East Region' },
      ]
      expect(res.locals.userProviders).toStrictEqual(expectedProviderOptions)
    })
    it('should create the correct team options', () => {
      const expectedTeamOptions = [
        {
          code: 'N07AAT',
          description: 'Automated Allocation Team',
          selected: 'selected',
        },
        { code: 'N07CHT', description: 'Automation SPG' },
        {
          code: 'N07IVH',
          description: 'Automation Test No Location Warning',
        },
        { code: 'N07SP1', description: 'Bexley\\Bromley SP TEST1' },
      ]
      expect(res.locals.userTeams).toStrictEqual(expectedTeamOptions)
    })
    it('should create the correct user options', () => {
      const expectedUserOptions = [
        {
          username: 'DeborahFern',
          nameAndRole: 'Deborah Fern (PS - Other)',
          staffCode: 'N07B795',
        },
        {
          username: 'IainChambers',
          nameAndRole: 'Iain Chambers (PS - Other)',
          staffCode: 'N57A054',
        },
        {
          username: 'peter-parker',
          nameAndRole: 'Peter Parker (PS - Other)',
          staffCode: 'N07B722',
          selected: 'selected',
        },
      ]
      expect(res.locals.userStaff).toStrictEqual(expectedUserOptions)
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
      const expectedProviderOptions = [
        { code: 'N50', name: 'Greater Manchester', selected: 'selected' },
        { code: 'N07', name: 'London' },
        { code: 'N54', name: 'North East Region' },
      ]
      expect(res.locals.userProviders).toStrictEqual(expectedProviderOptions)
    })
    it('should create the correct team options', () => {
      const expectedTeamOptions = [
        { code: 'N07AAT', description: 'Automated Allocation Team' },
        { code: 'N07CHT', description: 'Automation SPG' },
        {
          code: 'N07IVH',
          description: 'Automation Test No Location Warning',
          selected: 'selected',
        },
        { code: 'N07SP1', description: 'Bexley\\Bromley SP TEST1' },
      ]
      expect(res.locals.userTeams).toStrictEqual(expectedTeamOptions)
    })
    it('should create the correct user options', () => {
      const expectedUserOptions = [
        {
          username: 'DeborahFern',
          nameAndRole: 'Deborah Fern (PS - Other)',
          staffCode: 'N07B795',
        },
        {
          username: 'IainChambers',
          nameAndRole: 'Iain Chambers (PS - Other)',
          staffCode: 'N57A054',
        },
        {
          username: 'peter-parker',
          nameAndRole: 'Peter Parker (PS - Other)',
          staffCode: 'N07B722',
          selected: 'selected',
        },
      ]
      expect(res.locals.userStaff).toStrictEqual(expectedUserOptions)
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
  describe('Next function not provided', () => {
    const req = buildRequest()
    let returnValue: null | void
    beforeEach(async () => {
      returnValue = await getUserOptions(hmppsAuthClient)(req, res)
    })
    it('should update the user providers, teams and staff in the session', () => {
      const { data } = req.session
      const expectedProviders = [
        { code: 'N50', name: 'Greater Manchester', selected: 'selected' },
        { code: 'N07', name: 'London' },
        { code: 'N54', name: 'North East Region' },
      ]
      const expectedTeams = [
        { code: 'N07AAT', description: 'Automated Allocation Team' },
        { code: 'N07CHT', description: 'Automation SPG' },
        {
          code: 'N07IVH',
          description: 'Automation Test No Location Warning',
          selected: 'selected',
        },
        { code: 'N07SP1', description: 'Bexley\\Bromley SP TEST1' },
      ]
      const expectedStaff = [
        {
          username: 'DeborahFern',
          nameAndRole: 'Deborah Fern (PS - Other)',
          staffCode: 'N07B795',
        },
        {
          username: 'IainChambers',
          nameAndRole: 'Iain Chambers (PS - Other)',
          staffCode: 'N57A054',
          selected: 'selected',
        },
        {
          username: 'peter-parker',
          nameAndRole: 'Peter Parker (PS - Other)',
          staffCode: 'N07B722',
        },
      ]
      expect(mockSetDataValue).toHaveBeenNthCalledWith(1, data, ['providers', loggedInUsername], expectedProviders)
      expect(mockSetDataValue).toHaveBeenNthCalledWith(2, data, ['teams', loggedInUsername], expectedTeams)
      expect(mockSetDataValue).toHaveBeenNthCalledWith(3, data, ['staff', loggedInUsername], expectedStaff)
      expect(returnValue).toEqual(null)
    })
  })
})
