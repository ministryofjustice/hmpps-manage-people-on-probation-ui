import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import config from '../config'
import ArnsApiClient from '../data/arnsApiClient'
import { TimelineItem } from '../data/model/risk'
import TierApiClient from '../data/tierApiClient'
import { toTimeline, toRoshWidget } from '../utils'
import SentencePlanApiClient from '../data/sentencePlanApiClient'

const routes = [
  'getRisk',
  'getRiskFlag',
  'getRiskFlagSingleNote',
  'getRiskRemovalFlagSingleNote',
  'getRemovedRiskFlags',
] as const

const riskController: Controller<typeof routes, void> = {
  getRisk: hmppsAuthClient => {
    return async (req, res) => {
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
      const sentencePlanClient = new SentencePlanApiClient(token)
      const [personRisk, risks, tierCalculation, predictors, needs, sanIndicatorResponse] = await Promise.all([
        masClient.getPersonRiskFlags(crn),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
        arnsClient.getNeeds(crn),
        arnsClient.getSanIndicator(crn),
      ])
      let showSentencePlan: boolean
      let planLastUpdated = ''
      try {
        const sentencePlans = await sentencePlanClient.getPlanByCrn(crn)
        showSentencePlan = sentencePlans?.[0] !== undefined && res.locals?.user?.roles?.includes('SENTENCE_PLAN')
        if (showSentencePlan && sentencePlans[0]?.lastUpdatedDate) planLastUpdated = sentencePlans[0].lastUpdatedDate
      } catch (error) {
        showSentencePlan = false
      }
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
      return res.render('pages/risk', {
        personRisk,
        risks,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        timeline,
        needs,
        oasysLink,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
        showSentencePlan,
        planLastUpdated,
      })
    }
  },
  getRiskFlag: hmppsAuthClient => {
    return async (req, res) => {
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
      return res.render('pages/risk/flag', {
        personRiskFlag,
        crn,
      })
    }
  },
  getRiskFlagSingleNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_RISK_DETAIL_SINGLE_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personRiskFlag = await masClient.getPersonRiskFlagSingleNote(crn, id, noteId)
      return res.render('pages/risk/flag', {
        personRiskFlag,
        crn,
      })
    }
  },
  getRiskRemovalFlagSingleNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_RISK_DETAIL_REMOVAL_SINGLE_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personRiskFlag = await masClient.getPersonRiskRemovalFlagSingleNote(crn, id, noteId)
      return res.render('pages/risk/flag', {
        personRiskFlag,
        crn,
      })
    }
  },
  getRemovedRiskFlags: hmppsAuthClient => {
    return async (req, res) => {
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
    }
  },
}

export default riskController
