import { postCheckInDetails } from './postCheckInDetails'
import MasApiClient from '../data/masApiClient'
import ESupervisionClient from '../data/eSupervisionClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/eSupervisionClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

describe('postCheckInDetails', () => {
  const crn = 'X000001'
  const setupUuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
  const username = 'user-1'
  const token = 'system-token'
  // A valid base64-encoded SHA-256 digest (44 chars, single '=' pad), as the browser sends.
  const validSha256 = 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg='

  const baseCase = {
    name: { forename: 'John', surname: 'Doe' },
    dateOfBirth: '1990-01-01',
  }

  const buildReqRes = (overrides?: { checkins?: any; caseOverrides?: any; user?: any }) => {
    const checkins =
      overrides?.checkins ??
      ({
        date: '12/3/2025',
        interval: 'WEEK',
        checkInEmail: 'test@test.com',
        checkInMobile: '07123456789',
        photoUploadOption: '07123456789',
        preferredComs: 'EMAIL',
        eligibilityChoice: 'REPLACE_F2F',
      } as const)

    const req: any = {
      params: { crn, id: setupUuid },
      body: { contentSha256: validSha256 },
      session: {
        data: {
          esupervision: {
            [crn]: {
              [setupUuid]: {
                checkins,
              },
            },
          },
        },
      },
    }

    const res: any = {
      locals: {
        user: overrides?.user ?? { username },
        flags: { enableEsupervisionEligibility: true },
        case: { ...baseCase, ...(overrides?.caseOverrides ?? {}) },
      },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    return { req, res }
  }

  const hmppsAuthClient = new HmppsAuthClient(tokenStore) as jest.Mocked<HmppsAuthClient>

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(HmppsAuthClient.prototype, 'getSystemClientToken').mockResolvedValue(token)
  })

  it('posts offender setup and returns setup and upload location (with date conversion and MAS practitioner)', async () => {
    const { req, res } = buildReqRes()

    // Spy MAS to return practitioner username
    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockResolvedValue({ username: 'pp-user' } as any)

    const setup = { uuid: setupUuid }
    const uploadLocation = { locationInfo: { url: 'http://upload', method: 'PUT' } }

    const postOffenderSetup = jest
      .spyOn(ESupervisionClient.prototype, 'postOffenderSetup')
      .mockResolvedValue(setup as any)
    const getProfilePhotoUploadLocation = jest
      .spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation')
      .mockResolvedValue(uploadLocation as any)

    const handler = postCheckInDetails(hmppsAuthClient)
    const result = await handler(req, res)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith(username)
    expect(MasApiClient).toHaveBeenCalledWith(token)

    expect(postOffenderSetup).toHaveBeenCalledTimes(1)
    const calledWith = postOffenderSetup.mock.calls[0][0]
    expect(calledWith).toMatchObject({
      setupUuid,
      practitionerId: 'pp-user',
      crn,
      checkinInterval: 'WEEK',
      eligibilityChoice: 'REPLACE_F2F',
    })
    expect(calledWith.firstCheckin).toBe('2025/3/12')
    expect(typeof calledWith.startedAt).toBe('string')
    expect(calledWith.contactPreference).toBe('EMAIL')
    expect(calledWith.eligibilityChoice).toBe('REPLACE_F2F')

    expect(getProfilePhotoUploadLocation).toHaveBeenCalledWith(setup, 'image/jpeg', validSha256)
    expect(result).toEqual({ setup, uploadLocation })
  })

  it('forwards req.body.contentSha256 to getProfilePhotoUploadLocation', async () => {
    const { req, res } = buildReqRes()
    const contentSha256 = 'JsObCYHBZSL+IbLAd4dLfHXkD2bN84Qq3xLqEAi/0Lw='
    req.body = { contentSha256 }

    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockResolvedValue({ username: 'pp-user' } as any)

    const setup = { uuid: setupUuid }
    jest.spyOn(ESupervisionClient.prototype, 'postOffenderSetup').mockResolvedValue(setup as any)
    const getProfilePhotoUploadLocation = jest
      .spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation')
      .mockResolvedValue({ locationInfo: { url: 'http://upload', method: 'PUT' } } as any)

    await postCheckInDetails(hmppsAuthClient)(req, res)

    expect(getProfilePhotoUploadLocation).toHaveBeenCalledWith(setup, 'image/jpeg', contentSha256)
  })

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['whitespace only', '   '],
    ['not a string', 123],
  ])('throws 400 and does no work when contentSha256 is %s', async (_label, contentSha256) => {
    const { req, res } = buildReqRes()
    req.body = { contentSha256 }

    const getProbationPractitioner = jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner')
    const postOffenderSetup = jest.spyOn(ESupervisionClient.prototype, 'postOffenderSetup')
    const getProfilePhotoUploadLocation = jest.spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation')

    await expect(postCheckInDetails(hmppsAuthClient)(req, res)).rejects.toMatchObject({
      data: { status: 400 },
    })
    expect(getProbationPractitioner).not.toHaveBeenCalled()
    expect(postOffenderSetup).not.toHaveBeenCalled()
    expect(getProfilePhotoUploadLocation).not.toHaveBeenCalled()
  })

  it('falls back to res.locals.user.username when MAS practitioner username missing', async () => {
    const { req, res } = buildReqRes()

    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockResolvedValue({ username: undefined } as any)

    const setup = { uuid: setupUuid }
    const postOffenderSetup = jest
      .spyOn(ESupervisionClient.prototype, 'postOffenderSetup')
      .mockResolvedValue(setup as any)
    const getProfilePhotoUploadLocation = jest
      .spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation')
      .mockResolvedValue({
        locationInfo: { url: 'http://localhost:9091/esupervision/fake-s3-upload', method: 'PUT' },
      } as any)

    const handler = postCheckInDetails(hmppsAuthClient)
    await handler(req, res)

    const calledWith = postOffenderSetup.mock.calls[0][0]
    expect(calledWith.practitionerId).toBe(username)
  })

  it('throws error when ESupervisionClient.postOffenderSetup fails (no res.status/json)', async () => {
    const { req, res } = buildReqRes()

    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockResolvedValue({ username: 'pp-user' } as any)

    const error = Object.assign(new Error('registration failure'), {
      data: { status: 400, userMessage: 'Bad request' },
    })

    jest.spyOn(ESupervisionClient.prototype, 'postOffenderSetup').mockRejectedValue(error as any)
    const getProfilePhotoUploadLocation = jest.spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation')

    const handler = postCheckInDetails(hmppsAuthClient)

    await expect(handler(req, res)).rejects.toBe(error)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(getProfilePhotoUploadLocation).not.toHaveBeenCalled()
  })
})
