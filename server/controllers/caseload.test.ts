import httpMocks from 'node-mocks-http'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../logger'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { UserSchedule } from '../data/model/userSchedule'
import { mockAppResponse } from './mocks'
import { CaseSearchFilter, TeamCaseload, UserCaseload, UserTeam } from '../data/model/caseload'
import caseloadController from './caseload'
import { RecentlyViewedCase, UserAccess } from '../data/model/caseAccess'
import * as utils from '../utils'
import { checkAuditMessage } from './testutils'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

jest.mock('../utils', () => {
  return {
    ...jest.requireActual('../utils'),
    checkRecentlyViewedAccess: jest.fn(),
  }
})

const crn = 'X000001'
const mockPagination = { from: '1', items: [], next: '2', prev: '1', to: '0', total: '0' } as Pagination
const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

jest.mock('@ministryofjustice/probation-search-frontend/utils/pagination', () => ({
  __esModule: true,
  default: jest.fn(),
}))
;(getPaginationLinks as jest.Mock).mockReturnValue(mockPagination)

const mockResponse = {
  name: {
    forename: 'Eula',
    middleName: '',
    surname: 'Schmeler',
  },
  appointments: [
    { id: 1, type: 'Home visit', crn: 'X801756', dob: '1986-07-19' },
    { id: 2, type: '3 Way Meeting (Non NS)', crn: 'X801758', dob: '2001-08-24' },
  ],
} as unknown as UserSchedule

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const nextSpy = jest.fn()
const showCaseloadSpy = jest.spyOn(caseloadController, 'showCaseload')
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const mockCaseload = {} as UserCaseload
const mockFilters = {} as CaseSearchFilter

describe('caseloadController', () => {
  const getUserScheduleSpy = jest
    .spyOn(MasApiClient.prototype, 'getUserSchedule')
    .mockImplementation(() => Promise.resolve(mockResponse))

  const expectedUserSchedule = {
    ...mockResponse,
    appointments: [
      { ...mockResponse.appointments[0], birthdate: { day: '19', month: '07', year: '1986' } },
      { ...mockResponse.appointments[1], birthdate: { day: '24', month: '08', year: '2001' } },
    ],
  }

  const mockUserCaseload = {} as UserCaseload
  const searchUserCaseloadSpy = jest
    .spyOn(MasApiClient.prototype, 'searchUserCaseload')
    .mockImplementation(() => Promise.resolve(mockUserCaseload))

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('showCaseload', () => {
    jest.mock('../data/hmppsAuthClient', () => {
      return jest.fn().mockImplementation(() => {
        return {
          getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
        }
      })
    })

    const req = httpMocks.createRequest({
      session: {
        page: '1',
      },
    })
    const mockArgs = {
      caseload: mockCaseload,
      filter: mockFilters,
    }
    beforeEach(async () => {
      jest.clearAllMocks()
      await controllers.caseload.showCaseload(hmppsAuthClient)(req, res, nextSpy, mockArgs)
    })
    checkAuditMessage(res, 'VIEW_MAS_CASELOAD', uuidv4())
    it('should render minimal cases', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/minimal-cases', {
        pagination: mockPagination,
        caseload: mockCaseload,
        currentNavSection: 'yourCases',
        filter: mockFilters,
        url: '',
      })
    })
  })

  describe('postCase', () => {
    const req = httpMocks.createRequest({
      session: {
        page: '2',
        sortBy: 'name',
      },
      body: {
        nameOrCrn: crn,
        sentenceCode: '1234',
        nextContactCode: '5678',
      },
    })
    const expectedCaseFilter = {
      nameOrCrn: req.body.nameOrCrn,
      sentenceCode: req.body.sentenceCode,
      nextContactCode: req.body.nextContactCode,
    }
    it('should set session.caseFilter', async () => {
      await controllers.caseload.postCase(hmppsAuthClient)(req, res, nextSpy)
      expect(req.session.caseFilter).toEqual(expectedCaseFilter)
    })
    it('should request the caseload from the api', async () => {
      await controllers.caseload.postCase(hmppsAuthClient)(req, res, nextSpy)
      expect(searchUserCaseloadSpy).toHaveBeenCalledWith(
        res.locals.user.username,
        '0',
        req.session.sortBy,
        expectedCaseFilter,
      )
    })
    it('should call caseloadController.showCaseload', async () => {
      await controllers.caseload.postCase(hmppsAuthClient)(req, res, nextSpy)
      expect(showCaseloadSpy).toHaveBeenCalledWith(hmppsAuthClient)
    })
  })

  describe('getCase', () => {
    interface MockReq {
      session?: {
        sortBy?: string
        page?: string
      }
      query?: {
        clear?: string
        sortBy?: string
        page?: string
      }
    }

    const createMockRequest = (req?: MockReq): httpMocks.MockRequest<any> => {
      return httpMocks.createRequest({
        session: {
          sortBy: 'name',
          page: '2',
          caseFilter: {
            nameOrCrn: crn,
            sentenceCode: '1234',
            nextContactCode: '5678',
          },
          ...(req?.session || {}),
        },
        query: {
          clear: 'true',
          sortBy: 'sentence',
          page: '1',
          ...(req?.query || {}),
        },
      })
    }
    it('should reset the caseFilter session values to null if clear=true is in query', async () => {
      const req = createMockRequest()
      await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
      expect(req.session.caseFilter).toEqual({
        nameOrCrn: null,
        sentenceCode: null,
        nextContactCode: null,
      })
    })
    describe('sortBy session value exists', () => {
      it('sortBy session value should be updated to the sortBy query value if values are different', async () => {
        const req = createMockRequest()
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.sortBy).toEqual(req.query.sortBy)
      })
      it('sortBy session value should not be updated if the sortBy query is the same value', async () => {
        const req = createMockRequest({
          query: {
            sortBy: 'name',
          },
        })
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.sortBy).toEqual('name')
      })
    })
    describe('sortBy session value does not exist', () => {
      it('sortBy session value should equal sortBy query value if it exists in the url', async () => {
        const req = createMockRequest({
          session: {
            sortBy: undefined,
          },
        })
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.sortBy).toEqual(req.query.sortBy)
      })
      it('sortBy value should be set to default if the sortBy query value does not exist', async () => {
        const req = createMockRequest({
          session: {
            sortBy: undefined,
          },
          query: {
            sortBy: undefined,
          },
        })
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.sortBy).toEqual('nextContact.asc')
      })
    })
    describe('page session value exists', () => {
      it('should update page session value to query session value if different', async () => {
        const req = createMockRequest()
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.page).toEqual(req.query.page)
      })
    })
    describe('page session value does not exist', () => {
      it('should set the page session value to the page query value', async () => {
        const req = createMockRequest({
          session: {
            page: undefined,
          },
        })
        await controllers.caseload.getCase(hmppsAuthClient)(req, res, nextSpy)
        expect(req.session.page).toEqual(req.query.page)
      })
    })
    it('should request the caseload from the api', async () => {
      jest.clearAllMocks()
      const req = createMockRequest()
      await controllers.caseload.postCase(hmppsAuthClient)(req, res, nextSpy)
      expect(searchUserCaseloadSpy).toHaveBeenCalledWith(
        res.locals.user.username,
        '0',
        req.session.sortBy,
        req.session.caseFilter,
      )
    })
    it('should call caseloadController.showCaseload', async () => {
      const req = createMockRequest()
      await controllers.caseload.postCase(hmppsAuthClient)(req, res, nextSpy)
      expect(showCaseloadSpy).toHaveBeenCalledWith(hmppsAuthClient)
    })
  })

  describe('userSchedule', () => {
    it('renders the caseload appointments page with upcoming appointments', async () => {
      const sortBy = {
        name: 'none',
        dob: 'none',
        sentence: 'none',
        appointment: 'none',
        date: 'ascending',
      }
      const req = httpMocks.createRequest({
        query: {
          page: '',
        },
        url: '/caseload/appointments/upcoming',
      })

      await controllers.caseload.userSchedule(hmppsAuthClient)(req, res)
      expect(getUserScheduleSpy).toHaveBeenCalledWith({
        username: res.locals.user.username,
        page: req.query.page,
        size: '',
        sortBy: '',
        ascending: '',
        type: 'upcoming',
      })
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/appointments', {
        userSchedule: expectedUserSchedule,
        page: req.query.page,
        type: 'upcoming',
        sortBy,
        paginationUrl: '/caseload/appointments/upcoming?',
        sortUrl: '/caseload/appointments/upcoming',
      })
    })
    it('renders the upcoming appointment page with page and sort name ascending search parameters set in url', async () => {
      const sortBy = {
        name: 'ascending',
        dob: 'none',
        sentence: 'none',
        appointment: 'none',
        date: 'none',
      }
      const req = httpMocks.createRequest({
        query: {
          page: '2',
          sortBy: 'name.asc',
        },
        url: '/caseload/appointments/upcoming?page=0&sortBy=name.asc',
      })
      await controllers.caseload.userSchedule(hmppsAuthClient)(req, res)
      expect(getUserScheduleSpy).toHaveBeenCalledWith({
        username: res.locals.user.username,
        page: req.query.page,
        size: '',
        sortBy: 'name',
        ascending: 'true',
        type: 'upcoming',
      })
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/appointments', {
        userSchedule: expectedUserSchedule,
        page: req.query.page,
        type: 'upcoming',
        sortBy,
        paginationUrl: '/caseload/appointments/upcoming?sortBy=name.asc&',
        sortUrl: '/caseload/appointments/upcoming?page=2',
      })
    })
    it('renders the upcoming appointment page with page and sort appointment descending search parameters set in url', async () => {
      const sortBy = {
        name: 'none',
        dob: 'none',
        sentence: 'none',
        appointment: 'descending',
        date: 'none',
      }
      const req = httpMocks.createRequest({
        query: {
          page: '2',
          sortBy: 'appointment.desc',
        },
        url: '/caseload/appointments/upcoming?page=0&sortBy=appointment.asc',
      })
      await controllers.caseload.userSchedule(hmppsAuthClient)(req, res)
      expect(getUserScheduleSpy).toHaveBeenCalledWith({
        username: res.locals.user.username,
        page: req.query.page,
        size: '',
        sortBy: 'appointment',
        ascending: 'false',
        type: 'upcoming',
      })
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/appointments', {
        userSchedule: expectedUserSchedule,
        page: req.query.page,
        type: 'upcoming',
        sortBy,
        paginationUrl: '/caseload/appointments/upcoming?sortBy=appointment.desc&',
        sortUrl: '/caseload/appointments/upcoming?page=2',
      })
    })
    it('renders the caseload appointments page with appointments with no outcome', async () => {
      const sortBy = {
        name: 'none',
        dob: 'none',
        sentence: 'none',
        date: 'ascending',
      }
      const req = httpMocks.createRequest({
        query: {
          page: '0',
        },
        url: '/caseload/appointments/no-outcome?page=0',
      })
      await controllers.caseload.userSchedule(hmppsAuthClient)(req, res)
      expect(getUserScheduleSpy).toHaveBeenCalledWith({
        username: res.locals.user.username,
        page: req.query.page,
        size: '',
        sortBy: '',
        ascending: '',
        type: 'no-outcome',
      })
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/appointments', {
        userSchedule: expectedUserSchedule,
        page: req.query.page,
        type: 'no-outcome',
        sortBy,
        paginationUrl: '/caseload/appointments/no-outcome?',
        sortUrl: '/caseload/appointments/no-outcome?page=0',
      })
    })
    it('renders the outcomes to log page with the sortBy search param included in the url', async () => {
      const sortBy = {
        name: 'none',
        dob: 'none',
        sentence: 'descending',
        date: 'none',
      }
      const req = httpMocks.createRequest({
        query: {
          sortBy: 'sentence.desc',
        },
        url: '/caseload/appointments/no-outcome?sortBy=sentence.desc',
      })
      await controllers.caseload.userSchedule(hmppsAuthClient)(req, res)
      expect(getUserScheduleSpy).toHaveBeenCalledWith({
        username: res.locals.user.username,
        page: '',
        size: '',
        sortBy: 'sentence',
        ascending: 'false',
        type: 'no-outcome',
      })
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/appointments', {
        userSchedule: expectedUserSchedule,
        page: '',
        type: 'no-outcome',
        sortBy,
        paginationUrl: '/caseload/appointments/no-outcome?sortBy=sentence.desc&',
        sortUrl: '/caseload/appointments/no-outcome',
      })
    })
  })
  describe('Teams', () => {
    const redirectSpy = jest.spyOn(res, 'redirect')

    const setMockTeamResponse = (length = 1): [jest.SpyInstance, UserTeam] => {
      const teams = length ? Array.from({ length }).map((_item, _i) => ({ description: 'OMU A', code: 'N07T01' })) : []
      const mockUserTeams = { teams } as UserTeam
      const getUserTeamsSpy = jest
        .spyOn(MasApiClient.prototype, 'getUserTeams')
        .mockImplementationOnce(() => Promise.resolve(mockUserTeams))
      return [getUserTeamsSpy, mockUserTeams]
    }

    describe('getTeams', () => {
      describe('If req.session.mas.team is undefined', () => {
        let req: httpMocks.MockRequest<any>
        beforeEach(() => {
          req = httpMocks.createRequest({
            session: {},
          })
        })
        it('should request the user teams from the api', async () => {
          const [getUserTeamsSpy] = setMockTeamResponse(2)
          await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
          expect(getUserTeamsSpy).toHaveBeenCalledWith(res.locals.user.username)
        })
        it('should set req.session.mas', async () => {
          const teamCount = 2
          setMockTeamResponse(teamCount)
          await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
          expect(req.session.mas).toEqual({
            hasStaffRecord: true,
            teamCount,
          })
        })
        describe('If user has one team', () => {
          it('should set req.session.mas.team to the team code then redirect to /team/case', async () => {
            const [_, mockUserTeams] = setMockTeamResponse(1)
            await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
            expect(req.session.mas.team).toEqual(mockUserTeams.teams[0].code)
            expect(redirectSpy).toHaveBeenCalledWith('/team/case')
          })
        })
        describe('If user has zero teams', () => {
          it('should redirect to /team/case and not set req.session.mas.team', async () => {
            setMockTeamResponse(0)
            await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
            expect(req.session.mas.team).toBeUndefined()
            expect(redirectSpy).toHaveBeenCalledWith('/team/case')
          })
        })
        describe('If user has two teams', () => {
          let userTeams: UserTeam
          let spy: jest.SpyInstance
          beforeEach(async () => {
            ;[spy, userTeams] = setMockTeamResponse(2)
            await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
          })
          checkAuditMessage(res, 'VIEW_MAS_TEAMS', uuidv4())
          it('should render the select a team page', () => {
            expect(renderSpy).toHaveBeenCalledWith('pages/caseload/select-team', { userTeams })
          })
        })
      })
      describe('If req.session.mas.team is defined', () => {
        beforeEach(async () => {
          const req = httpMocks.createRequest({ session: { mas: { team: 'N07T01' } } })
          await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
        })
        it('should redirect to /team/case', () => {
          expect(redirectSpy).toHaveBeenCalledWith('/team/case')
        })
      })
    })
    describe('getChangeTeam', () => {
      const req = httpMocks.createRequest({
        session: {
          mas: {
            team: 'N07T01',
          },
        },
      })
      let getUserTeamsSpy: jest.SpyInstance
      let userTeams: UserTeam
      beforeEach(async () => {
        ;[getUserTeamsSpy, userTeams] = setMockTeamResponse()
        await controllers.caseload.getChangeTeam(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_TEAMS', uuidv4())
      it('should request the user teams from the api', async () => {
        await controllers.caseload.getTeams(hmppsAuthClient)(req, res)
        expect(getUserTeamsSpy).toHaveBeenCalledWith(res.locals.user.username)
      })
      it('should render the select a team page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/caseload/select-team', {
          userTeams,
          currentTeam: req.session.mas.team,
        })
      })
    })
    describe('getTeamCase', () => {
      const mockTeamCaseload = {
        caseload: [
          {
            staff: {
              name: {
                forename: 'Archibald',
                surname: 'Queeny',
              },
              code: 'N07P007',
            },
            caseName: {
              forename: 'AutoTestFirstName -ueocswot',
              middleName: 'AutoTestSecondName -umaixqis AutoTestThirdName -ftmjnetw',
              surname: 'AutoTestSurname -cpjtgqxm',
            },
            crn: 'X410375',
          },
        ],
      } as unknown as TeamCaseload
      const getTeamCaseloadSpy = jest
        .spyOn(MasApiClient.prototype, 'getTeamCaseload')
        .mockImplementation(() => Promise.resolve(mockTeamCaseload))
      describe('req.session.mas is undefined', () => {
        it('should redirect to /teams', async () => {
          const req = httpMocks.createRequest({
            session: {},
          })
          await controllers.caseload.getTeamCase(hmppsAuthClient)(req, res)
          expect(redirectSpy).toHaveBeenCalledWith('/teams')
        })
      })
      describe('req.session.mas.teamCount > 0 and req.session.mas.team is undefined', () => {
        it('should redirect to /teams', async () => {
          const req = httpMocks.createRequest({
            session: {
              mas: {
                teamCount: 1,
              },
            },
          })
          await controllers.caseload.getTeamCase(hmppsAuthClient)(req, res)
          expect(redirectSpy).toHaveBeenCalledWith('/teams')
        })
      })

      describe('req.session.mas is defined', () => {
        const team = 'N07T01'
        describe('teamCount is higher than zero', () => {
          const req = httpMocks.createRequest({
            query: {
              page: '1',
            },
            session: {
              mas: {
                teamCount: 1,
                team,
                hasStaffRecord: true,
              },
            },
          })
          beforeEach(async () => {
            await controllers.caseload.getTeamCase(hmppsAuthClient)(req, res)
          })
          checkAuditMessage(res, 'VIEW_MAS_CASELOAD_TEAM', uuidv4(), team, 'TEAM')
          it('should request the team caseload from the api', async () => {
            expect(getTeamCaseloadSpy).toHaveBeenCalledWith(req.session.mas.team, '0')
          })
          it('should render the caseload page', () => {
            expect(renderSpy).toHaveBeenCalledWith('pages/caseload/minimal-cases', {
              pagination: mockPagination,
              caseload: mockTeamCaseload,
              currentNavSection: 'teamCases',
              teamCount: 1,
              hasStaffRecord: true,
            })
          })
        })
        describe('teamCount is zero', () => {
          const req = httpMocks.createRequest({
            query: {
              page: '1',
            },
            session: {
              mas: {
                teamCount: 0,
                team: 'N07T01',
                hasStaffRecord: true,
              },
            },
          })
          beforeEach(async () => {
            await controllers.caseload.getTeamCase(hmppsAuthClient)(req, res)
          })
          checkAuditMessage(res, 'VIEW_MAS_CASELOAD_TEAM', uuidv4(), team, 'TEAM')
          it('should not request the team caseload from the api', () => {
            expect(getTeamCaseloadSpy).not.toHaveBeenCalled()
          })
          it('should render the caseload page', () => {
            expect(renderSpy).toHaveBeenCalledWith('pages/caseload/minimal-cases', {
              pagination: mockPagination,
              caseload: { totalPages: 0, totalElements: 0, pageSize: 0 },
              currentNavSection: 'teamCases',
              teamCount: 0,
              hasStaffRecord: true,
            })
          })
        })
      })
    })
    describe('postTeamCase', () => {
      const loggerSpy = jest.spyOn(logger, 'info')
      describe('team-code is not in request body', () => {
        const req = httpMocks.createRequest({
          body: {},
          session: {},
        })
        let getUserTeamsSpy: jest.SpyInstance
        let userTeams: UserTeam
        beforeEach(async () => {
          ;[getUserTeamsSpy, userTeams] = setMockTeamResponse()
          await controllers.caseload.postTeamCase(hmppsAuthClient)(req, res)
        })
        it('should log info', () => {
          expect(loggerSpy).toHaveBeenCalledWith('Team not selected')
        })
        it('should request user teams from the api', () => {
          expect(getUserTeamsSpy).toHaveBeenCalledWith(res.locals.user.username)
        })
        it('should render the select team page', () => {
          expect(renderSpy).toHaveBeenCalledWith('pages/caseload/select-team', {
            errorMessages: {
              team: { text: 'Please select a team' },
            },
            userTeams,
          })
        })
      })
      describe('team-code is in request body', () => {
        const req = httpMocks.createRequest({
          session: {
            mas: {
              team: '',
            },
          },
          body: {
            'team-code': 'N07T01',
          },
        })
        beforeEach(async () => {
          await controllers.caseload.postTeamCase(hmppsAuthClient)(req, res)
        })
        it('should set req.session.mas.team value to the team code', () => {
          expect(req.session.mas.team).toEqual(req.body['team-code'])
        })
        it('should redirect to the teams page', () => {
          expect(redirectSpy).toHaveBeenCalledWith('/teams')
        })
      })
    })
  })

  describe('getRecentCases', () => {
    const req = httpMocks.createRequest({
      session: {},
    })
    beforeEach(async () => {
      await controllers.caseload.getRecentCases()(req, res)
    })
    it('should set the backLink session value', () => {
      expect(req.session.backLink).toEqual('/recent-cases')
    })
    checkAuditMessage(res, 'VIEW_MAS_RECENT_CASES', uuidv4())

    it('should render the recent cases page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/recent-cases', { currentNavSection: 'recentCases' })
    })
  })
  describe('checkAccess', () => {
    const sendSpy = jest.spyOn(res, 'send')
    const accessCrn = 'X777916'
    const mockRecentlyViewed: RecentlyViewedCase[] = [
      {
        name: '',
        crn: accessCrn,
        dob: '1985-02-21',
        age: '40',
        tierScore: '',
        sentence: '',
        numberOfAdditionalSentences: '0',
        limitedAccess: false,
      },
    ]
    jest.spyOn(utils, 'checkRecentlyViewedAccess').mockImplementation(() => mockRecentlyViewed)
    const mockUserAccess = {
      crn: accessCrn,
      userExcluded: false,
      userRestricted: false,
    } as unknown as UserAccess
    const checkUserAccessSpy = jest
      .spyOn(MasApiClient.prototype, 'checkUserAccess')
      .mockImplementation(() => Promise.resolve(mockUserAccess))
    const req = httpMocks.createRequest({
      session: {},
      body: mockRecentlyViewed,
    })
    beforeEach(async () => {
      await controllers.caseload.checkAccess(hmppsAuthClient)(req, res)
    })
    it('should request the user access from the api', () => {
      expect(checkUserAccessSpy).toHaveBeenCalledWith(res.locals.user.username, [accessCrn])
    })
    it('should send the updated recently viewed access in the request', () => {
      expect(sendSpy).toHaveBeenCalledWith(mockRecentlyViewed)
    })
  })
})
