import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'

const crn = 'X000001'

describe('addContactController', () => {
  describe('getAddContact', () => {
    const req = httpMocks.createRequest({
      params: { crn },
    })
    const res = mockAppResponse()
    const renderSpy = jest.spyOn(res, 'render')

    beforeEach(async () => {
      jest.resetAllMocks()
      await controllers.addContact.getAddContact()(req, res)
    })

    it('should render the contact page with the crn', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/contact-log/contact/contact', { crn, formValues: {} })
    })
  })

  describe('postAddContact', () => {
    const req = httpMocks.createRequest({
      params: { crn },
    })
    const res = mockAppResponse()
    const redirectSpy = jest.spyOn(res, 'redirect')

    beforeEach(async () => {
      jest.resetAllMocks()
      await controllers.addContact.postAddContact()(req, res)
    })

    it('should redirect to the contact log', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/contact-log`)
    })
  })
})
