import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getPersonPhoto, personPhotoHref } from './getPersonPhoto'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { mockAppResponse } from '../controllers/mocks'

jest.mock('node:stream/promises', () => ({ pipeline: jest.fn().mockResolvedValue(undefined) }))

const hmppsAuthClient = {
  getSystemClientToken: jest.fn().mockResolvedValue('token-1'),
} as unknown as HmppsAuthClient
const mpopComponents = { getPersonPhoto: jest.fn() } as unknown as jest.Mocked<MPoPComponents>

describe('middleware/getPersonPhoto', () => {
  const req = httpMocks.createRequest({ params: { nomsNumber: 'A1234BC' } })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('streams the photo as a cached jpeg when there is one', async () => {
    const photo = Readable.from(['image'])
    mpopComponents.getPersonPhoto.mockResolvedValue({ photo, httpStatus: 200, error: null })
    const res = mockAppResponse()
    const setSpy = jest.spyOn(res, 'set')
    const typeSpy = jest.spyOn(res, 'type')

    await getPersonPhoto(hmppsAuthClient, mpopComponents)(req, res)

    expect(mpopComponents.getPersonPhoto).toHaveBeenCalledWith('token-1', 'A1234BC')
    expect(setSpy).toHaveBeenCalledWith('Cache-Control', 'private, max-age=86400')
    expect(typeSpy).toHaveBeenCalledWith('image/jpeg')
    expect(pipeline).toHaveBeenCalledWith(photo, res)
  })

  it.each([
    ['there is no photo', { photo: null, httpStatus: 404, error: null }],
    ['the request fails', { photo: null, httpStatus: 500, error: new Error('500') }],
  ])('returns a 404 without a placeholder when %s', async (_case, response) => {
    mpopComponents.getPersonPhoto.mockResolvedValue(response)
    const res = mockAppResponse()
    const redirectSpy = jest.spyOn(res, 'redirect')

    await getPersonPhoto(hmppsAuthClient, mpopComponents)(req, res)

    expect(res.sendStatus).toHaveBeenCalledWith(404)
    expect(redirectSpy).not.toHaveBeenCalled()
    expect(pipeline).not.toHaveBeenCalled()
  })

  it('builds the photo href from the NOMS number', () => {
    expect(personPhotoHref('A1234BC')).toBe('/person-photo/A1234BC')
  })
})
