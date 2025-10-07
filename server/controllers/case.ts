import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils'

const routes = ['getCase'] as const

const caseController: Controller<typeof routes, void> = {
  getCase: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const sentenceNumber = (req?.query?.sentenceNumber ?? '') as string
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_OVERVIEW',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [overview, risks, needs, personRisks, tierCalculation, predictors, sanIndicatorResponse] =
        await Promise.all([
          masClient.getOverview(crn, sentenceNumber),
          arnsClient.getRisks(crn),
          arnsClient.getNeeds(crn),
          masClient.getPersonRiskFlags(crn),
          tierClient.getCalculationDetails(crn),
          arnsClient.getPredictorsAll(crn),
          arnsClient.getSanIndicator(crn),
        ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/overview', {
        overview,
        needs,
        personRisks,
        risks,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
      })
    }
  },
}

export default caseController
