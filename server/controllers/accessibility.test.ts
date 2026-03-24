import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { checkSendAuditMessage } from './testutils'
import { SubjectType } from '../middleware/sendAuditMessage'

const res = mockAppResponse()
const req = httpMocks.createRequest()
const renderSpy = jest.spyOn(res, 'render')

jest.mock('@ministryofjustice/hmpps-audit-client')

describe('accessibilityController', () => {
  describe('getAccessibility', () => {
    beforeAll(async () => {
      await controllers.accessibility.getAccessibility()(req, res)
    })
    it('should render the accessibility page', () => {
      checkSendAuditMessage(res, 'VIEW_MAS_ACCESSIBILITY', res.locals.user.username, SubjectType.USER)
      expect(renderSpy).toHaveBeenCalledWith('pages/accessibility')
    })
  })
})
