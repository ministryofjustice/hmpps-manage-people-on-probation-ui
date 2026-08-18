import httpMocks from 'node-mocks-http'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
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
jest.mock('stream/promises', () => ({
  pipeline: jest.fn().mockResolvedValue(undefined), // Simulate a successful stream completion
}))

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
    it('should render the new search page when feature flag enabled', async () => {
      const resFlag = mockAppResponse({
        flags: {
          enableSearchV2: true,
        },
      })
      const renderSpy = jest.spyOn(resFlag, 'render')
      await controllers.search.getSearch()(req, resFlag)
      checkSendAuditMessage(resFlag, 'VIEW_MAS_SEARCH', resFlag.locals.user.username, SubjectType.USER)
      expect(renderSpy).toHaveBeenCalledWith('pages/search-new', { results: { response: {} } })
    })
    it('should render the old search page when feature flag disabled', async () => {
      const resFlag = mockAppResponse({
        flags: {
          enableSearchV2: false,
        },
      })
      const renderSpy = jest.spyOn(resFlag, 'render')
      await controllers.search.getSearch()(req, resFlag)
      checkSendAuditMessage(resFlag, 'VIEW_MAS_SEARCH', resFlag.locals.user.username, SubjectType.USER)
      expect(renderSpy).toHaveBeenCalledWith('pages/search')
    })
  })

  describe('getPhoto', () => {
    it('should pipe photo stream if photo exists', async () => {
      await controllers.search.getPhoto(hmppsAuthClient)(req, res)
      expect(getPrisonerImageSpy).toHaveBeenCalledWith(req.params.prisonerId)
      expect(pipeline).toHaveBeenCalledWith(mockStream, res)
    })
    it('should redirect if 404 occurs', async () => {
      getPrisonerImageSpy.mockImplementationOnce(() => Promise.resolve(null))
      await controllers.search.getPhoto(hmppsAuthClient)(req, res)
      expect(getPrisonerImageSpy).toHaveBeenCalledWith(req.params.prisonerId)
      expect(redirectSpy).toHaveBeenCalledWith('/assets/images/NoPhoto@2x.png')
    })
  })
})
