import httpMocks from 'node-mocks-http'
import footerController from './footerController'
import { mockAppResponse } from './mocks'
import { SubjectType } from '../middleware/sendAuditMessage'
import { checkSendAuditMessage } from './testutils'

jest.mock('@ministryofjustice/hmpps-audit-client')

describe('footerController', () => {
  const res = mockAppResponse()
  const renderSpy = jest.spyOn(res, 'render')

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getPrivacyPolicy', () => {
    it('should render the privacy policy page with default backLink', async () => {
      const req = httpMocks.createRequest()

      const controller = footerController.getPrivacyPolicy()(req, res)
      await controller

      expect(renderSpy).toHaveBeenCalledWith('pages/privacy-notice', {
        backLink: '/',
      })
      checkSendAuditMessage(res, 'VIEW_MAS_PRIVACY_POLICY', res.locals.user.username, SubjectType.USER)
    })

    it('should render the privacy policy page with session backLink', async () => {
      const req = httpMocks.createRequest({
        session: {
          backLink: '/previous-page',
        },
      })

      const controller = footerController.getPrivacyPolicy()(req, res)
      await controller

      expect(renderSpy).toHaveBeenCalledWith('pages/privacy-notice', {
        backLink: '/previous-page',
      })
      checkSendAuditMessage(res, 'VIEW_MAS_PRIVACY_POLICY', res.locals.user.username, SubjectType.USER)
    })
  })

  describe('getCookiePolicy', () => {
    it('should render the cookie policy page with default backLink', async () => {
      const req = httpMocks.createRequest()

      const controller = footerController.getCookiePolicy()(req, res)
      await controller

      expect(renderSpy).toHaveBeenCalledWith('pages/cookies-policy', {
        backLink: '/',
      })
      checkSendAuditMessage(res, 'VIEW_MAS_COOKIE_POLICY', res.locals.user.username, SubjectType.USER)
    })

    it('should render the cookie policy page with session backLink', async () => {
      const req = httpMocks.createRequest({
        session: {
          backLink: '/previous-page',
        },
      })

      const controller = footerController.getCookiePolicy()(req, res)
      await controller

      expect(renderSpy).toHaveBeenCalledWith('pages/cookies-policy', {
        backLink: '/previous-page',
      })
      checkSendAuditMessage(res, 'VIEW_MAS_COOKIE_POLICY', res.locals.user.username, SubjectType.USER)
    })
  })
})
