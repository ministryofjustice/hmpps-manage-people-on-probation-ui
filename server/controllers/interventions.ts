import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import InterventionsApiClient from '../data/interventionsApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils'

const routes = ['getInterventions'] as const

const interventionsController: Controller<typeof routes> = {
  getInterventions: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const interventionsApiClient = new InterventionsApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_INTERVENTIONS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personSummary, interventions, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getPersonSummary(crn),
        interventionsApiClient.getInterventions(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/interventions', {
        personSummary,
        interventions,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
}

export default interventionsController
