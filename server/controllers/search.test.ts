import httpMocks from 'node-mocks-http'
import controllers from '.'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from './mocks'

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
tokenStore.getToken.mockResolvedValue(token.access_token)
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const req = httpMocks.createRequest({
  session: {},
})

describe('searchController', () => {
  describe('getSearch', () => {
    beforeEach(async () => {
      await controllers.search.getSearch()(req, res)
    })
    it('should set the back link session value', () => {
      expect(req.session.backLink).toEqual('/search')
    })
    it('should render the search page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/search')
    })
  })
})
