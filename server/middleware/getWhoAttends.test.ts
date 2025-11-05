import httpMocks, { RequestMethod } from 'node-mocks-http'
import { getWhoAttends } from './getWhoAttends'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, probationPractitioner, userProviders } from '../controllers/mocks'
import { ProbationPractitioner } from '../models/CaseDetail'
import { convertToTitleCase } from '../utils'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
// eslint-disable-next-line no-useless-escape
const regex = /[\(\)]/
const nextSpy = jest.fn()
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

xdescribe('/middleware/getWhoAttends()', () => {
  const crn = 'X000001'
  const uuid = 'a4615940-2808-4ab5-a8e0-feddecb8ae1a'
  const username = 'user-1'
  const providerCode = 'N56'
  const teamCode = 'N56XXXX'
  const nameAndRole = `${probationPractitioner.name.forename} ${probationPractitioner.name.surname} (COM)`

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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('providerCode or back query parameter does not exist in url', () => {
    const req = buildRequest()
    beforeEach(() => {
      getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    const { providerCode: sessionProviderCode, teamCode: sessionTeamCode } =
      req.session.data.appointments[crn][uuid].user
    it('should get selected region and team from the session', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, sessionProviderCode, sessionTeamCode)
    })
  })
  describe('back query parameter exists in url', () => {
    const req = buildRequest({ query: { back: '/back/url' } })
    beforeEach(() => {
      getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    const { providerCode: sessionProviderCode, teamCode: sessionTeamCode } =
      req.session.data.appointments[crn][uuid].user
    it('should get selected region and team from the session', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, sessionProviderCode, sessionTeamCode)
    })
  })
  describe('providerCode exists in query string of url', () => {
    const req = buildRequest({ query: { providerCode, teamCode } })
    beforeEach(() => {
      getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get selected region and team from the session', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCode, teamCode)
    })
  })
  describe('GET request', () => {
    describe('Probation practitioner allocated', () => {
      describe('selected providerCode and teamCode do not match probation practitioner', () => {
        const req = buildRequest({
          query: { providerCode: 'N11', teamCode: 'N11XXX' },
        })
        beforeEach(() => {
          jest
            .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
            .mockImplementationOnce(() => Promise.resolve(probationPractitioner))
          getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should save the providers, teams and staff to req.session.data', () => {
          expect(req.session.data).toStrictEqual({
            ...req.session.data,
            providers: {
              [username]: [...userProviders.providers, { ...probationPractitioner.provider }],
            },
            teams: {
              [username]: [...userProviders.teams],
            },
            staff: {
              [username]: [
                ...userProviders.users.map(user => ({
                  username: user.username,
                  nameAndRole: convertToTitleCase(user.nameAndRole, [], regex),
                })),
              ],
            },
          })
        })
        it('should save the correct providers to locals and select the practitioners region as the selected option', () => {
          expect(res.locals.userProviders).toStrictEqual([
            ...userProviders.providers,
            { ...probationPractitioner.provider },
          ])
        })
        it('should save the correct teams to locals and select the practitioners team as the selected option', () => {
          expect(res.locals.userTeams).toStrictEqual([...userProviders.teams])
        })
        it('should save the correct staff to locals and select the practitioners user as the selected option', () => {
          expect(res.locals.userStaff).toStrictEqual([
            ...userProviders.users.map(user => ({
              username: user.username,
              nameAndRole: convertToTitleCase(user.nameAndRole, [], regex),
            })),
          ])
        })
        it('should save the correct default user details to locals', () => {
          expect(res.locals.attendingUser).toStrictEqual({
            username: probationPractitioner.username,
            homeArea: probationPractitioner.provider.name,
            team: probationPractitioner.team.description,
          })
        })
        it('should save the selected providerCode and teamCode to locals', () => {
          expect(res.locals.providerCode).toEqual(req.query.providerCode)
          expect(res.locals.teamCode).toEqual(req.query.teamCode)
        })
        it('should call next()', () => {
          expect(nextSpy).toHaveBeenCalled()
        })
      })
      describe('selected providerCode and teamCode match probation practitioner', () => {
        const req = buildRequest({
          query: { providerCode: probationPractitioner.provider.code, teamCode: probationPractitioner.team.code },
        })
        beforeEach(() => {
          jest
            .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
            .mockImplementationOnce(() => Promise.resolve(probationPractitioner))
          getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
        })
        it('should save the providers, teams and staff to req.session.data', () => {
          expect(req.session.data).toStrictEqual({
            ...req.session.data,
            providers: {
              [username]: [...userProviders.providers, { ...probationPractitioner.provider, selected: 'selected' }],
            },
            teams: {
              [username]: [...userProviders.teams, { ...probationPractitioner.team, selected: 'selected' }],
            },
            staff: {
              [username]: [
                ...userProviders.users.map(user => ({
                  username: user.username,
                  nameAndRole: convertToTitleCase(user.nameAndRole, [], regex),
                })),
                {
                  username: probationPractitioner.username,
                  nameAndRole,
                },
              ],
            },
          })
        })
        it('should save the correct providers to locals and select the practitioners region as the selected option', () => {
          expect(res.locals.userProviders).toStrictEqual([
            ...userProviders.providers,
            { ...probationPractitioner.provider, selected: 'selected' },
          ])
        })
        it('should save the correct teams to locals and select the practitioners team as the selected option', () => {
          expect(res.locals.userTeams).toStrictEqual([
            ...userProviders.teams,
            { ...probationPractitioner.team, selected: 'selected' },
          ])
        })
        it('should save the correct staff to locals and select the practitioners user as the selected option', () => {
          expect(res.locals.userStaff).toStrictEqual([
            ...userProviders.users.map(user => ({
              username: user.username,
              nameAndRole: convertToTitleCase(user.nameAndRole, [], regex),
            })),
            {
              username: probationPractitioner.username,
              nameAndRole,
            },
          ])
        })
      })
    })
    describe('Probation practitioner unallocated', () => {
      const req = buildRequest()
      const mockUnallocatedPractitionerResponse: ProbationPractitioner = {
        ...probationPractitioner,
        unallocated: true,
      }
      beforeEach(() => {
        const spy = jest
          .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
          .mockImplementationOnce(() => Promise.resolve(mockUnallocatedPractitionerResponse))
        getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
      })
      it('should save the providers, teams and staff to req.session.data', () => {
        expect(req.session.data).toStrictEqual({
          ...req.session.data,
          providers: {
            [username]: [...userProviders.providers],
          },
          teams: {
            [username]: [...userProviders.teams],
          },
          staff: {
            [username]: [
              ...userProviders.users.map(user => ({
                username: user.username,
                nameAndRole: convertToTitleCase(user.nameAndRole, [], regex),
              })),
            ],
          },
        })
      })
      it('should save the correct providers to locals and select the default region as the selected option', () => {
        expect(res.locals.userProviders).toStrictEqual([
          userProviders.providers[0],
          { ...userProviders.providers[1] },
          userProviders.providers[2],
        ])
      })
      it('should save the correct teams to locals and select the default team as the selected option', () => {
        expect(res.locals.userTeams).toStrictEqual([
          userProviders.teams[0],
          { ...userProviders.teams[1] },
          userProviders.teams[2],
        ])
      })
      it('should save the correct staff to locals and select the default user as the selected option', () => {
        expect(res.locals.userStaff).toStrictEqual([
          {
            ...userProviders.users[0],
            nameAndRole: convertToTitleCase(userProviders.users[0].nameAndRole, [], regex),
          },
          { ...userProviders.users[1], nameAndRole: convertToTitleCase(userProviders.users[1].nameAndRole, [], regex) },
        ])
      })
      it('should save the correct default user details to locals', () => {
        expect(res.locals.attendingUser).toStrictEqual(userProviders.defaultUserDetails)
      })
    })
  })

  describe('POST request', () => {
    const req = buildRequest({
      data: {
        providers: {
          [username]: [...userProviders.providers, { ...probationPractitioner.provider }],
        },
        teams: {
          [username]: [...userProviders.teams, { ...probationPractitioner.team }],
        },
        staff: {
          [username]: [
            ...userProviders.users,
            {
              username: probationPractitioner.username,
              nameAndRole,
            },
          ],
        },
      },
    })
    beforeEach(() => {
      getWhoAttends(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should save the correct providers to locals', () => {
      expect(res.locals.userProviders).toEqual(req.session.data.providers[username])
    })
    it('should save the correct teams to locals', () => {
      expect(res.locals.userTeams).toEqual(req.session.data.teams[username])
    })
    it('should save the correct staff to locals', () => {
      expect(res.locals.userStaff).toEqual(req.session.data.staff[username])
    })
  })
})
