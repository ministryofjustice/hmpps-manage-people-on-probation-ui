import { Controller } from '../@types'
import TechnicalUpdatesService from '../services/technicalUpdatesService'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getWhatsNew'] as const

const whatsNewController: Controller<typeof routes, void> = {
  getWhatsNew: () => {
    const technicalUpdatesService = new TechnicalUpdatesService()
    return async (req, res) => {
      await sendAuditMessage(res, 'VIEW_MAS_WHATS_NEW', res.locals.user.username, SubjectType.USER)
      return res.render('pages/whats-new', {
        title: 'New features | Manage people on probation',
        referrer: req.get('Referrer'),
        technicalUpdates: technicalUpdatesService.getTechnicalUpdates(),
        guidanceUrl: config.guidance.link,
      })
    }
  },
}

export default whatsNewController
