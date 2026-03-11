import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import InterventionsApiClient from '../data/interventionsApiClient'
import { checkAuditMessage } from './testutils'
import { mockAppResponse, mockPersonSummary, mockInterventions } from './mocks'

jest.mock('../data/masApiClient')
jest.mock('../data/interventionsApiClient')
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

const getPersonSummarySpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonSummary')
  .mockImplementation(() => Promise.resolve(mockPersonSummary))
const getInterventionsSpy = jest
  .spyOn(InterventionsApiClient.prototype, 'getInterventions')
  .mockImplementation(() => Promise.resolve(mockInterventions))
const req = httpMocks.createRequest({
  params: {
    crn,
  },
})

describe('interventionsController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getInterventions', () => {
    beforeEach(async () => {
      await controllers.interventions.getInterventions(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_INTERVENTIONS', uuidv4(), crn, 'CRN')
    it('should request the page data from the api', () => {
      expect(getPersonSummarySpy).toHaveBeenCalledWith(crn)
      expect(getInterventionsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the interventions page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/interventions', {
        personSummary: mockPersonSummary,
        interventions: mockInterventions,
        crn,
      })
    })
  })
})
