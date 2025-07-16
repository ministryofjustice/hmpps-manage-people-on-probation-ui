import httpMocks from 'node-mocks-http'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import config from '../config'
import { mockUserAppointments, mockAppResponse } from './mocks'

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

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)
const getUserAppointmentsSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserAppointments')
  .mockImplementation(() => Promise.resolve(mockUserAppointments))
const req = httpMocks.createRequest({
  params: {
    crn,
  },
})

describe('homeController', () => {
  describe('getHome', () => {
    beforeEach(async () => {
      await controllers.home.getHome(hmppsAuthClient)(req, res)
    })
    it('should request the user appointments from the api', () => {
      expect(getUserAppointmentsSpy).toHaveBeenCalledWith(res.locals.user.username)
    })
    it('should render the home page', () => {
      const { totalAppointments, totalOutcomes, appointments, outcomes } = mockUserAppointments
      expect(renderSpy).toHaveBeenCalledWith('pages/homepage/homepage', {
        totalAppointments,
        totalOutcomes,
        appointments,
        outcomes,
        delius_link: config.delius.link,
        oasys_link: config.oaSys.link,
        interventions_link: config.interventions.link,
        recall_link: config.recall.link,
        cas1_link: config.cas1.link,
        cas3_link: config.cas3.link,
        caval_link: config.caval.link,
        esupervision_link: config.esupervision.link,
        epf2_link: config.epf2.link,
      })
    })
  })
})
