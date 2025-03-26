import httpMocks from 'node-mocks-http'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { UserSchedule } from '../data/model/userSchedule'
import { mockAppResponse } from './mocks'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

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

describe('caseloadController', () => {
  const res = mockAppResponse()
  const renderSpy = jest.spyOn(res, 'render')

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

  afterEach(() => {
    jest.clearAllMocks()
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
})
