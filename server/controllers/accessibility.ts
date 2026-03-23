import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getAccessibility'] as const

const accessibilityController: Controller<typeof routes, void> = {
  getAccessibility: () => {
    return async (_req, res) => {
      await sendAuditMessage(res, 'VIEW_MAS_ACCESSIBILITY', res.locals.user.username, SubjectType.USER)
      return res.render('pages/accessibility')
    }
  },
}

export default accessibilityController
