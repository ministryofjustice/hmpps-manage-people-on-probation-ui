import httpMocks from 'node-mocks-http'
import { Readable } from 'stream'
import controllers from '.'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from './mocks'
import { checkSendAuditMessage } from './testutils'
import { SubjectType } from '../middleware/sendAuditMessage'
import PrisonApiClient from '../data/prisonApiClient'
import { HmppsAuthClient } from '../data'

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
jest.mock('../data/prisonApiClient')
jest.mock('@ministryofjustice/hmpps-audit-client')

const mockStream = new Readable()
mockStream.setEncoding('utf8')
mockStream.push('mock data')
mockStream.push(null)

const getPrisonerImageSpy = jest
  .spyOn(PrisonApiClient.prototype, 'getImageData')
  .mockImplementation(() => Promise.resolve(mockStream))

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const redirectSpy = jest.spyOn(res, 'redirect')
const req = httpMocks.createRequest({
  session: {},
  params: {
    prisonerId: 'prisoner-1',
  },
  user: {
    username: 'user1',
  },
})
const fromSpy = jest.spyOn(Readable, 'from')

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

describe('searchController', () => {
  describe('getSearch', () => {
    beforeEach(async () => {
      await controllers.search.getSearch()(req, res)
    })
    it('should set the back link session value', () => {
      expect(req.session.backLink).toEqual('/search')
    })
    it('should render the search page', () => {
      checkSendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      expect(renderSpy).toHaveBeenCalledWith('pages/search', { results: { response: {} } })
    })
  })

  describe('getPhoto', () => {
    it('should pipe photo stream if photo exists', async () => {
      await controllers.search.getPhoto(hmppsAuthClient)(req, res)
      expect(getPrisonerImageSpy).toHaveBeenCalledWith(req.params.prisonerId)
      checkSendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      expect(fromSpy).toHaveBeenCalledWith(mockStream)
    })
    it('should redirect if 404 occurs', async () => {
      getPrisonerImageSpy.mockImplementationOnce(() => Promise.resolve(null))
      await controllers.search.getPhoto(hmppsAuthClient)(req, res)
      expect(getPrisonerImageSpy).toHaveBeenCalledWith(req.params.prisonerId)
      checkSendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      expect(redirectSpy).toHaveBeenCalledWith('/assets/images/NoPhoto@2x.png')
    })
  })
})
