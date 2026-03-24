import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { checkSendAuditMessage } from './testutils'
import { SubjectType } from '../middleware/sendAuditMessage'

const crn = 'X000001'

jest.mock('@ministryofjustice/hmpps-audit-client')

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
      checkSendAuditMessage(res, 'ADD_MAS_CONTACT', crn, SubjectType.CRN)
      expect(renderSpy).toHaveBeenCalledWith('pages/add-contact', { crn })
    })
  })
})
