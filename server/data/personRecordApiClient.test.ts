import nock from 'nock'
import { Readable } from 'stream'
import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import PersonRecordApiClient from './personRecordApiClient'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})

const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('personRecordClient', () => {
  let fakePrisonApiClient: nock.Scope
  let personRecordClient: PersonRecordApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakePrisonApiClient = nock(config.apis.personRecordApi.url)
    personRecordClient = new PersonRecordApiClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll() // Removes all interceptors
    nock.restore() // Restores http/https modules
    nock.activate() // Re-activate for the next test
  })

  describe('getImageData', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should return data from api', async () => {
      const mockStream = new Readable()
      mockStream.setEncoding('utf8')
      mockStream.push('mock data')
      mockStream.push(null)

      const nomsNumber = 'nomsNumber'
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
      fakePrisonApiClient
        .get(`/person/prison/${nomsNumber}/image`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, mockStream, {
          'Content-Type': 'application/octet-stream',
        })

      const output = await personRecordClient.getImageData(nomsNumber)
      let result = ''
      for await (const chunk of output) {
        if (typeof chunk === 'number') {
          result += String.fromCharCode(chunk)
        } else {
          result += chunk.toString('utf8')
        }
      }
      expect(result).toEqual('mock data')
    })
  })
})
