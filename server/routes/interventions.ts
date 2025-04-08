import { type Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import InterventionsApiClient from '../data/interventionsApiClient'
import type { Route } from '../@types'
import { toPredictors, toRoshWidget } from '../utils'
import ArnsApiClient from '../data/arnsApiClient'

export default function interventionsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/interventions', async (req, res, _next) => {
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
    res.render('pages/interventions', {
      personSummary,
      interventions,
      tierCalculation,
      crn,
      risksWidget,
      predictorScores,
    })
  })
}
