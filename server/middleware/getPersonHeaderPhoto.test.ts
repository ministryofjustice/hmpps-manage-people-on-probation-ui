import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getPersonHeaderPhoto } from './getPersonHeaderPhoto'
import { mockAppResponse } from '../controllers/mocks'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import logger from '../../logger'

const crn = 'X000001'
const noms = 'A1234BC'
const checkInPhotoUrl = 'https://bucket.s3.eu-west-2.amazonaws.com/X000001.jpg'

const mpopComponents = {
  getCheckInPhotoUrl: jest.fn(),
  hasPersonPhoto: jest.fn(),
} as unknown as jest.Mocked<MPoPComponents>
const getToken = jest.fn().mockResolvedValue('token-1')

const flags = { enablePersonHeader: true, enablePersonHeaderPhoto: true, enableESUPCheckInPhotosForSearch: true }

const run = (res: AppResponse, cachedDetails?: Partial<PersonalDetailsSession>) =>
  getPersonHeaderPhoto({ res, mpopComponents, getToken, crn, noms, cachedDetails })

describe('middleware/getPersonHeaderPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: null, httpStatus: 404, error: null })
    mpopComponents.hasPersonPhoto.mockResolvedValue({ hasPhoto: false, httpStatus: 404, error: null })
  })

  it.each([
    { enablePersonHeader: true, enablePersonHeaderPhoto: false },
    { enablePersonHeader: false, enablePersonHeaderPhoto: true },
  ])('returns no photo and makes no requests when the photo is switched off: %o', async photoFlags => {
    const res = mockAppResponse({ flags: { ...flags, ...photoFlags } })

    const result = await run(res, {
      overview: {},
      personPhotoSrc: `/person-photo/${noms}`,
    } as Partial<PersonalDetailsSession>)

    expect(result).toEqual({ personPhotoSrc: undefined, photoUnavailable: false })
    expect(mpopComponents.getCheckInPhotoUrl).not.toHaveBeenCalled()
    expect(mpopComponents.hasPersonPhoto).not.toHaveBeenCalled()
  })

  it('uses the online check-in photo first without checking for a prison photo', async () => {
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: checkInPhotoUrl, httpStatus: 200, error: null })
    const res = mockAppResponse({ flags })

    const result = await run(res)

    expect(mpopComponents.getCheckInPhotoUrl).toHaveBeenCalledWith('token-1', crn)
    expect(mpopComponents.hasPersonPhoto).not.toHaveBeenCalled()
    expect(result).toEqual({ personPhotoSrc: checkInPhotoUrl, photoUnavailable: false })
  })

  it('gets the online check-in photo once per request', async () => {
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: checkInPhotoUrl, httpStatus: 200, error: null })
    const res = mockAppResponse({ flags })

    await run(res)
    const result = await run(res)

    expect(mpopComponents.getCheckInPhotoUrl).toHaveBeenCalledTimes(1)
    expect(result.personPhotoSrc).toBe(checkInPhotoUrl)
  })

  it('does not get the online check-in photo when enableESUPCheckInPhotosForSearch is off', async () => {
    const res = mockAppResponse({ flags: { ...flags, enableESUPCheckInPhotosForSearch: false } })

    await run(res)

    expect(mpopComponents.getCheckInPhotoUrl).not.toHaveBeenCalled()
  })

  it('logs the error and falls back to the prison photo when the check-in request fails', async () => {
    const error = new Error('Server error')
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation()
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: null, httpStatus: 500, error })
    mpopComponents.hasPersonPhoto.mockResolvedValue({ hasPhoto: true, httpStatus: 200, error: null })
    const res = mockAppResponse({ flags })

    const result = await run(res)

    expect(loggerSpy).toHaveBeenCalledWith(error, `Failed to get the online check-in photo for CRN ${crn}`)
    expect(result).toEqual({ personPhotoSrc: `/person-photo/${noms}`, photoUnavailable: false })
  })

  it('flags the photo as unavailable when the check-in request fails and there is no prison photo', async () => {
    jest.spyOn(logger, 'error').mockImplementation()
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: null, httpStatus: 500, error: new Error('500') })
    const res = mockAppResponse({ flags })

    const result = await run(res)

    expect(result).toEqual({ personPhotoSrc: undefined, photoUnavailable: true })
  })

  it('flags the photo as unavailable on later lookups in the same request when the check-in request failed', async () => {
    jest.spyOn(logger, 'error').mockImplementation()
    mpopComponents.getCheckInPhotoUrl.mockResolvedValue({ photoUrl: null, httpStatus: 500, error: new Error('500') })
    const res = mockAppResponse({ flags })

    await run(res)
    const result = await run(res, { overview: {}, personPhotoSrc: null } as Partial<PersonalDetailsSession>)

    expect(mpopComponents.getCheckInPhotoUrl).toHaveBeenCalledTimes(1)
    expect(result.photoUnavailable).toBe(true)
  })

  it('checks for a prison photo and caches the result when there is no check-in photo', async () => {
    mpopComponents.hasPersonPhoto.mockResolvedValue({ hasPhoto: true, httpStatus: 200, error: null })
    const cachedDetails = { overview: {} } as Partial<PersonalDetailsSession>

    const result = await run(mockAppResponse({ flags }), cachedDetails)

    expect(mpopComponents.hasPersonPhoto).toHaveBeenCalledWith('token-1', noms)
    expect(result).toEqual({ personPhotoSrc: `/person-photo/${noms}`, photoUnavailable: false })
    expect(cachedDetails.personPhotoSrc).toBe(`/person-photo/${noms}`)
  })

  it('caches no prison photo as null', async () => {
    const cachedDetails = { overview: {} } as Partial<PersonalDetailsSession>

    const result = await run(mockAppResponse({ flags }), cachedDetails)

    expect(result.personPhotoSrc).toBeUndefined()
    expect(cachedDetails.personPhotoSrc).toBeNull()
  })

  it('uses the cached prison photo without checking again', async () => {
    const cachedDetails = { overview: {}, personPhotoSrc: `/person-photo/${noms}` } as Partial<PersonalDetailsSession>

    const result = await run(mockAppResponse({ flags }), cachedDetails)

    expect(mpopComponents.hasPersonPhoto).not.toHaveBeenCalled()
    expect(result.personPhotoSrc).toBe(`/person-photo/${noms}`)
  })

  it('flags the photo as unavailable and does not cache the result when the prison photo check fails', async () => {
    mpopComponents.hasPersonPhoto.mockResolvedValue({ hasPhoto: false, httpStatus: 500, error: new Error('500') })
    const cachedDetails = { overview: {} } as Partial<PersonalDetailsSession>

    const result = await run(mockAppResponse({ flags }), cachedDetails)

    expect(result).toEqual({ personPhotoSrc: undefined, photoUnavailable: true })
    expect(cachedDetails.personPhotoSrc).toBeUndefined()
  })
})
