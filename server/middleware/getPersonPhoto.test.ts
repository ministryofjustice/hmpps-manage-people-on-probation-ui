import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getPersonPhoto } from './getPersonPhoto'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { mockAppResponse } from '../controllers/mocks'

const hmppsAuthClient = {
  getSystemClientToken: jest.fn().mockResolvedValue('token-1'),
} as unknown as HmppsAuthClient
const mpopComponents = { sendPersonPhoto: jest.fn() } as unknown as jest.Mocked<MPoPComponents>

describe('middleware/getPersonPhoto', () => {
  it('sends the photo for the NOMS number with a system token', async () => {
    const req = httpMocks.createRequest({ params: { nomsNumber: 'A1234BC' } })
    const res = mockAppResponse()

    await getPersonPhoto(hmppsAuthClient, mpopComponents)(req, res)

    expect(mpopComponents.sendPersonPhoto).toHaveBeenCalledWith('token-1', 'A1234BC', res)
  })
})
