import httpMocks from 'node-mocks-http'
import { redirectWizard } from './checkinCyaRedirect'
import { mockAppResponse } from '../controllers/mocks'

const crn = 'X000001'
const cya = false
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const res = mockAppResponse()
const redirectSpy = jest.spyOn(res, 'redirect')

describe('redirectWizard', () => {
  it('redirects to checkin summary when cya=true', async () => {
    const req = httpMocks.createRequest({
      params: { crn, id: uuid },
      query: { cya: 'true' },
    })

    const nextSpy = jest.fn()

    await redirectWizard()(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/checkin-summary`)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('calls next when cya is not true', async () => {
    const req = httpMocks.createRequest({
      params: { crn, id: uuid },
      query: { cya: 'false' },
    })

    const nextSpy = jest.fn()
    await redirectWizard()(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('calls next when cya is true and change=mobile  ', async () => {
    const req = httpMocks.createRequest({
      params: { crn, id: uuid },
      query: { cya: 'true' },
      body: { change: 'mobile' },
    })

    const nextSpy = jest.fn()
    await redirectWizard()(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
