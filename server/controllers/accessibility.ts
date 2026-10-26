import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const accessibilityController: Controller<readonly ['getAccessibility'], void> = {
  getAccessibility: () => {
    return async function getAccessibility(_req, res) {
      await sendAuditMessage(res, 'VIEW_MAS_ACCESSIBILITY', res.locals.user.username, SubjectType.USER)
      return res.render('pages/accessibility')
    }
  },
}

export default accessibilityController
