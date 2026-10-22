import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const footerController: Controller<readonly ['getPrivacyPolicy', 'getCookiePolicy'], void> = {
  getPrivacyPolicy: () => {
    return async function getPrivacyPolicy(req, res) {
      await sendAuditMessage(res, 'VIEW_MAS_PRIVACY_POLICY', res.locals.user.username, SubjectType.USER)
      return res.render('pages/privacy-notice', {
        backLink: req.session?.backLink || '/',
      })
    }
  },
  getCookiePolicy: () => {
    return async function getCookiePolicy(req, res) {
      await sendAuditMessage(res, 'VIEW_MAS_COOKIE_POLICY', res.locals.user.username, SubjectType.USER)
      return res.render('pages/cookies-policy', {
        backLink: req.session?.backLink || '/',
      })
    }
  },
}

export default footerController
