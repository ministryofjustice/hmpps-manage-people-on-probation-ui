import nock from 'nock'
import config from '../config'
import PrisonRegisterApiClient, { Prison } from './prisonRegisterApiClient'

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('Prison Register ApiClient', () => {
  let fakePrisonRegisterApiClient: nock.Scope
  let prisonRegisterApiClient: PrisonRegisterApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakePrisonRegisterApiClient = nock(config.apis.prisonRegisterApi.url)
    prisonRegisterApiClient = new PrisonRegisterApiClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
    nock.restore()
    nock.activate()
  })

  describe('fetch prison details', () => {
    it('should return prison details from api', async () => {
      const prisonId = 'MDI'

      const response: Prison = {
        prisonId: 'MDI',
        prisonName: 'Moorland (HMP & YOI)',
        prisonNameInWelsh: 'Carchar Brynbuga',
        active: true,
        male: true,
        female: false,
        contracted: true,
      }

      fakePrisonRegisterApiClient
        .get(`/prisons/id/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await prisonRegisterApiClient.getPrison(prisonId)

      expect(output).toEqual(response)
    })
  })
})
