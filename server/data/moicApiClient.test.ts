import nock from 'nock'
import config from '../config'
import MoicApiClient, { PomToRoHandoverData, PrisonOffenderManagerData } from './moicApiClient'

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('MOICApiClient', () => {
  let fakeHandoverApiClient: nock.Scope
  let handoverApiClient: MoicApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakeHandoverApiClient = nock(config.apis.moicApi.url)
    handoverApiClient = new MoicApiClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
    nock.restore()
    nock.activate()
  })

  describe('fetch handover details', () => {
    it('should return handover details from api', async () => {
      const nomsNumber = 'A1234BC'

      const response: PomToRoHandoverData = {
        nomsNumber: 'A1234BC',
        handoverDate: '2026-09-25',
        handoverStartDate: '2026-09-26',
        responsibility: 'COM',
        responsibleComName: 'John Smith',
        responsiblePomName: 'Andrew Langley',
      }

      fakeHandoverApiClient
        .get(`/api/handovers/${nomsNumber}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await handoverApiClient.getPomToRoHandoverDetails(nomsNumber)

      expect(output).toEqual(response)
    })
  })

  describe('fetch pom name', () => {
    it('should return pom details from api', async () => {
      const nomsNumber = 'A1234BC'

      const response: PrisonOffenderManagerData = {
        primary_pom: {
          name: 'Andrew Langley',
          staff_id: 1,
        },
        secondary_pom: {
          name: 'James Smith',
          staff_id: 2,
        },
      }

      fakeHandoverApiClient
        .get(`/api/allocation/${nomsNumber}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await handoverApiClient.getPomName(nomsNumber)

      expect(output).toEqual(response)
    })
  })
})
