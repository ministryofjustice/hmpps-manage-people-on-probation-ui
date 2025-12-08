import { postCheckinInComplete } from './postCheckinComplete'
import ESupervisionClient from '../data/eSupervisionClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import logger from '../../logger'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/eSupervisionClient')
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

describe('postCheckinInComplete middleware', () => {
  const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
  const username = 'user-1'
  const token = 'system-token'

  const buildReqRes = (overrides?: { user?: { username?: string } }) => {
    const req = {
      params: { id },
    } as unknown as Parameters<ReturnType<typeof postCheckinInComplete>>[0]

    const res = {
      locals: {
        user: overrides?.user ?? { username },
      },
    } as unknown as Parameters<ReturnType<typeof postCheckinInComplete>>[1]

    return { req, res }
  }

  const hmppsAuthClient = new HmppsAuthClient(tokenStore) as jest.Mocked<HmppsAuthClient>

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(HmppsAuthClient.prototype, 'getSystemClientToken').mockImplementation(async () => token)
  })

  it('Should calls postOffenderSetupComplete with id using system token and logs success', async () => {
    const { req, res } = buildReqRes()

    const postComplete = jest
      .spyOn(ESupervisionClient.prototype, 'postOffenderSetupComplete')
      .mockImplementation(async () => undefined)

    const logSpy = jest.spyOn(logger, 'info')

    const handler = postCheckinInComplete(hmppsAuthClient)
    await handler(req, res)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith(username)
    expect(ESupervisionClient).toHaveBeenCalledWith(token)
    expect(postComplete).toHaveBeenCalledTimes(1)
    expect(postComplete).toHaveBeenCalledWith(id)
    expect(logSpy).toHaveBeenCalledWith('Checkin Registration completed successfully.')
  })

  it('Should propagates error when postOffenderSetupComplete fails (no response handling)', async () => {
    const { req, res } = buildReqRes()

    const error = Object.assign(new Error('completion failed'), {
      data: { status: 500, userMessage: 'Internal error' },
    })

    jest.spyOn(ESupervisionClient.prototype, 'postOffenderSetupComplete').mockRejectedValue(error as unknown as Error)
    const logSpy = jest.spyOn(logger, 'info')

    const handler = postCheckinInComplete(hmppsAuthClient)

    await expect(handler(req, res)).rejects.toBe(error)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
