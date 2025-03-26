import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils/utils'

const routes = ['getCompliance'] as const

const complianceController: Controller<typeof routes> = {
  getCompliance: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_COMPLIANCE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      const [personCompliance, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getPersonCompliance(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/compliance', {
        personCompliance,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
}

export default complianceController
