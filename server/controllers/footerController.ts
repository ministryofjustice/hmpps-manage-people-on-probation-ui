import { Controller } from '../@types'
import TechnicalUpdatesService from '../services/technicalUpdatesService'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getPrivacyPolicy', 'getCookiePolicy'] as const

const footerController: Controller<typeof routes, void> = {
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
