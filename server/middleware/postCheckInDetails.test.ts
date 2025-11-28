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
      } as const)

    const req: any = {
      params: { crn, id: setupUuid },
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
    const uploadLocation = { url: 'http://upload', contentType: 'image/jpeg', duration: 'PT5M' }

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
      firstName: baseCase.name.forename,
      lastName: baseCase.name.surname,
      dateOfBirth: baseCase.dateOfBirth,
      crn,
      email: 'test@test.com',
      phoneNumber: '07123456789',
      checkinInterval: 'WEEK',
    })
    expect(calledWith.firstCheckinDate).toBe('2025/3/12')
    expect(typeof calledWith.startedAt).toBe('string')

    expect(getProfilePhotoUploadLocation).toHaveBeenCalledWith(setup, 'image/jpeg')
    expect(result).toEqual({ setup, uploadLocation })
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
        url: 'http://localhost:9091/esupervision/fake-s3-upload',
        contentType: 'image/jpeg',
        duration: '5',
      } as any)

    const handler = postCheckInDetails(hmppsAuthClient)
    await handler(req, res)

    const calledWith = postOffenderSetup.mock.calls[0][0]
    expect(calledWith.practitionerId).toBe(username)
  })

  it('handles error from ESupervisionClient and responds with status and message', async () => {
    const { req, res } = buildReqRes()

    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockResolvedValue({ username: 'pp-user' } as any)

    const error = Object.assign(new Error('boom'), { data: { status: 400, userMessage: 'Bad request' } })

    jest.spyOn(ESupervisionClient.prototype, 'postOffenderSetup').mockRejectedValue(error as any)
    jest.spyOn(ESupervisionClient.prototype, 'getProfilePhotoUploadLocation').mockResolvedValue({} as any)

    const handler = postCheckInDetails(hmppsAuthClient)

    await expect(handler(req, res)).rejects.toBe(error)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ status: 'ERROR', message: 'Bad request' })
  })
})
