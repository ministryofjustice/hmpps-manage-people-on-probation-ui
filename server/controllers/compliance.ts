import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'

const routes = ['getCompliance'] as const

const complianceController: Controller<typeof routes, void> = {
  getCompliance: hmppsAuthClient => {
    return async function getCompliance(req, res) {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_COMPLIANCE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      const [personCompliance, tierCalculation] = await Promise.all([
        masClient.getPersonCompliance(crn),
        tierClient.getCalculationDetails(crn),
      ])
      return res.render('pages/compliance', {
        personCompliance,
        tierCalculation,
        crn,
      })
    }
  },
}

export default complianceController
