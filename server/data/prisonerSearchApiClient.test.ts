import nock from 'nock'
import config from '../config'
import PrisonerSearchApiClient, { Prisoner } from './prisonerSearchApiClient'

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('prisonerSearchApiClient', () => {
  let fakePrisonerSearchApiClient: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakePrisonerSearchApiClient = nock(config.apis.prisonerSearchApi.url)
    prisonerSearchApiClient = new PrisonerSearchApiClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
    nock.restore()
    nock.activate()
  })

  describe('getPrisonerDetails', () => {
    it('should return prisoner details from api', async () => {
      const nomsNumber = 'A1234BC'

      const response: Prisoner = {
        prisonerNumber: nomsNumber,
        firstName: 'Andrew',
        middleNames: 'John',
        lastName: 'Langley',
        status: 'ACTIVE',
        legalStatus: 'SENTENCED',
        lastMovementTypeCode: 'ADM',
        lastMovementReasonCode: 'UAL',
        lastMovementDate: '2026-09-25',
        inOutStatus: 'IN',
        prisonId: 'LEI',
        prisonName: 'Leicester',
        lastPrisonId: 'LEI',
        recall: false,
        releaseDate: '2027-09-25',
      }

      fakePrisonerSearchApiClient
        .get(`/prisoner/${nomsNumber}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.getPrisonerDetails(nomsNumber)

      expect(output).toEqual(response)
    })
  })
})
