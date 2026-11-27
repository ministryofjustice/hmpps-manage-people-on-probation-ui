import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getPersonHeaderPhoto } from './getPersonHeaderPhoto'
import { mockAppResponse } from '../controllers/mocks'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'

const crn = 'X000001'
const noms = 'A1234BC'
const checkInPhotoUrl = 'https://bucket.s3.eu-west-2.amazonaws.com/X000001.jpg'

const mpopComponents = {
  getPersonHeaderPhoto: jest.fn(),
} as unknown as jest.Mocked<MPoPComponents>
const getToken = jest.fn().mockResolvedValue('token-1')

const flags = { enablePersonHeader: true, enablePersonHeaderPhoto: true, enableESUPCheckInPhotosForSearch: true }

const run = (res: AppResponse, cachedDetails?: Partial<PersonalDetailsSession>) =>
  getPersonHeaderPhoto({ res, mpopComponents, getToken, crn, noms, cachedDetails })

const libOptions = () => mpopComponents.getPersonHeaderPhoto.mock.calls[0][1]

describe('middleware/getPersonHeaderPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mpopComponents.getPersonHeaderPhoto.mockResolvedValue({ photo: undefined, photoUnavailable: false })
  })

  it.each([
    { enablePersonHeader: true, enablePersonHeaderPhoto: false },
    { enablePersonHeader: false, enablePersonHeaderPhoto: true },
  ])('returns no photo and makes no requests when the photo is switched off: %o', async photoFlags => {
    const res = mockAppResponse({ flags: { ...flags, ...photoFlags } })

    const result = await run(res)

    expect(result).toEqual({ personPhotoSrc: undefined, photoUnavailable: false })
    expect(mpopComponents.getPersonHeaderPhoto).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('returns the photo from the component lib', async () => {
    mpopComponents.getPersonHeaderPhoto.mockResolvedValue({ photo: checkInPhotoUrl, photoUnavailable: true })

    const result = await run(mockAppResponse({ flags }))

    expect(result).toEqual({ personPhotoSrc: checkInPhotoUrl, photoUnavailable: true })
    expect(mpopComponents.getPersonHeaderPhoto).toHaveBeenCalledWith('token-1', {
      crn,
      noms,
      prisonPhotoHref: expect.any(Function),
      includeCheckInPhoto: true,
      checkInPhoto: undefined,
      hasPrisonPhoto: undefined,
    })
    expect(libOptions().prisonPhotoHref(noms)).toBe(`/person-photo/${noms}`)
  })

  it('does not include the online check-in photo when enableESUPCheckInPhotosForSearch is off', async () => {
    await run(mockAppResponse({ flags: { ...flags, enableESUPCheckInPhotosForSearch: false } }))

    expect(libOptions().includeCheckInPhoto).toBe(false)
  })

  it('gets the online check-in photo once per request', async () => {
    const checkInPhoto = { photoUrl: checkInPhotoUrl, failed: false }
    mpopComponents.getPersonHeaderPhoto.mockResolvedValue({
      photo: checkInPhotoUrl,
      photoUnavailable: false,
      checkInPhoto,
    })
    const res = mockAppResponse({ flags })

    await run(res)
    await run(res)

    expect(res.locals.checkInPhoto).toEqual({ crn, ...checkInPhoto })
    expect(mpopComponents.getPersonHeaderPhoto.mock.calls[1][1].checkInPhoto).toEqual({ crn, ...checkInPhoto })
  })

  it('does not reuse the online check-in photo of another CRN', async () => {
    const res = mockAppResponse({ flags })
    res.locals.checkInPhoto = { crn: 'X999999', photoUrl: checkInPhotoUrl, failed: false }

    await run(res)

    expect(libOptions().checkInPhoto).toBeUndefined()
  })

  it.each([
    [`/person-photo/${noms}`, true],
    [null, false],
  ])('passes the cached prison photo %s as hasPrisonPhoto %s', async (personPhotoSrc, hasPrisonPhoto) => {
    await run(mockAppResponse({ flags }), { overview: {}, personPhotoSrc } as Partial<PersonalDetailsSession>)

    expect(libOptions().hasPrisonPhoto).toBe(hasPrisonPhoto)
  })

  it.each([
    [true, `/person-photo/${noms}`],
    [false, null],
  ])('caches a prison photo result of %s as %s', async (hasPrisonPhoto, personPhotoSrc) => {
    mpopComponents.getPersonHeaderPhoto.mockResolvedValue({ photo: undefined, photoUnavailable: false, hasPrisonPhoto })
    const cachedDetails = { overview: {} } as Partial<PersonalDetailsSession>

    await run(mockAppResponse({ flags }), cachedDetails)

    expect(cachedDetails.personPhotoSrc).toBe(personPhotoSrc)
  })

  it('does not cache anything when the prison photo was not checked', async () => {
    const cachedDetails = { overview: {} } as Partial<PersonalDetailsSession>

    await run(mockAppResponse({ flags }), cachedDetails)

    expect(cachedDetails).not.toHaveProperty('personPhotoSrc')
  })
})
