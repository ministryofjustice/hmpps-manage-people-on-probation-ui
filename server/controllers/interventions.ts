import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import InterventionsApiClient from '../data/interventionsApiClient'

const routes = ['getInterventions'] as const

const interventionsController: Controller<typeof routes, void> = {
  getInterventions: hmppsAuthClient => {
    return async function getInterventions(req, res) {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const interventionsApiClient = new InterventionsApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_INTERVENTIONS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personSummary, interventions] = await Promise.all([
        masClient.getPersonSummary(crn),
        interventionsApiClient.getInterventions(crn),
      ])
      return res.render('pages/interventions', {
        personSummary,
        interventions,
        crn,
      })
    }
  },
}

export default interventionsController
