import { type Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import { TimelineItem } from '../data/model/risk'
import { toRoshWidget, toTimeline } from '../utils'
import type { Route } from '../@types'
import config from '../config'

export default function risksRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/risk', async (req, res, _next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_RISKS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const arnsClient = new ArnsApiClient(token)
    const masClient = new MasApiClient(token)
    const tierClient = new TierApiClient(token)

    const [personRisk, risks, tierCalculation, predictors, needs] = await Promise.all([
      masClient.getPersonRiskFlags(crn),
      arnsClient.getRisks(crn),
      tierClient.getCalculationDetails(crn),
      arnsClient.getPredictorsAll(crn),
      arnsClient.getNeeds(crn),
    ])
    let timeline: TimelineItem[] = []
    let predictorScores
    if (Array.isArray(predictors)) {
      timeline = toTimeline(predictors)
    }
    if (timeline.length > 0) {
      ;[predictorScores] = timeline
    }

    const risksWidget = toRoshWidget(risks)
    const oasysLink = config.oaSys.link

    res.render('pages/risk', {
      personRisk,
      risks,
      crn,
      tierCalculation,
      risksWidget,
      predictorScores,
      timeline,
      needs,
      oasysLink,
    })
  })

  get('/case/:crn/risk/flag/:id', async (req, res, _next) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_RISK_DETAIL',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const personRiskFlag = await masClient.getPersonRiskFlag(crn, id)

    res.render('pages/risk/flag', {
      personRiskFlag,
      crn,
    })
  })

  get('/case/:crn/risk/removed-risk-flags', async (req, res, _next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_REMOVED_RISKS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const personRisk = await masClient.getPersonRiskFlags(crn)

    res.render('pages/risk/removed-risk-flags', {
      personRisk,
      crn,
    })
  })
}
