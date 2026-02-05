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

    it('should render the add-contact page with the crn', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/add-contact', { crn })
    })
  })
})
