import { type Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import type { Route } from '../@types'
import { toPredictors, toRoshWidget } from '../utils/utils'

export default function caseRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn', async (req, res, _next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const arnsClient = new ArnsApiClient(token)
    const tierClient = new TierApiClient(token)
    const sentenceNumber = (req?.query?.sentenceNumber || '') as string
    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_OVERVIEW',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const [overview, risks, needs, personRisks, tierCalculation, predictors] = await Promise.all([
      masClient.getOverview(crn, sentenceNumber),
      arnsClient.getRisks(crn),
      arnsClient.getNeeds(crn),
      masClient.getPersonRiskFlags(crn),
      tierClient.getCalculationDetails(crn),
      arnsClient.getPredictorsAll(crn),
    ])

    const risksWidget = toRoshWidget(risks)
    const predictorScores = toPredictors(predictors)
    res.render('pages/overview', {
      overview,
      needs,
      personRisks,
      risks,
      crn,
      tierCalculation,
      risksWidget,
      predictorScores,
    })
  })
}
