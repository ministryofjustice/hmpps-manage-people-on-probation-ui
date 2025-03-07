import httpMocks from 'node-mocks-http'
import renders from '.'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import MasApiClient from '../../data/masApiClient'
import { UserSchedule } from '../../data/model/userSchedule'

jest.mock('../../data/masApiClient')
jest.mock('../../data/tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../../data/hmppsAuthClient', () => {
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

describe('caseload controllers', () => {
  const req = httpMocks.createRequest({
    query: {
      page: '0',
    },
  })

  const res = httpMocks.createResponse({
    locals: {
      user: {
        username: 'USER1',
      },
    },
  })
  const renderSpy = jest.spyOn(res, 'render')

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('upcomingAppointments', () => {
    it('200 response', async () => {
      const getUserScheduleSpy = jest
        .spyOn(MasApiClient.prototype, 'getUserSchedule')
        .mockImplementationOnce(() => Promise.resolve(mockResponse))

      await renders.upcomingAppointments(hmppsAuthClient)(req, res)
      const expectedUserSchedule = {
        ...mockResponse,
        appointments: [
          { ...mockResponse.appointments[0], birthdate: { day: '19', month: '07', year: '1986' } },
          { ...mockResponse.appointments[1], birthdate: { day: '24', month: '08', year: '2001' } },
        ],
      }
      expect(getUserScheduleSpy).toHaveBeenCalledWith(res.locals.user.username, req.query.page)
      expect(renderSpy).toHaveBeenCalledWith('pages/caseload/upcoming-appointments', {
        userSchedule: expectedUserSchedule,
        page: req.query.page,
      })
    })
  })
})
