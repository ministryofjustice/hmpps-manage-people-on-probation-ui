import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils/utils'

const routes = [
  'getSentence',
  'getProbationHistory',
  'getPreviousOrders',
  'getPreviousOrderDetails',
  'getOffenceDetails',
  'getLicenceConditionNote',
  'getRequirementNote',
] as const

interface QueryParams {
  activeSentence: string
  number?: string
}

const sentenceController: Controller<typeof routes> = {
  getSentence: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { activeSentence, number } = req.query
      const query: QueryParams = {
        activeSentence: (activeSentence as string) || 'true',
      }
      if (number) {
        query.number = number as string
      }
      const setQuery = (acc: string, key: string, value: any, index: number): string => {
        const separator = index === 0 ? `?` : '&'
        return `${acc}${separator}${key}=${value}`
      }
      const queryParam = Object.entries(query).reduce((acc, [k, v], i) => setQuery(acc, k, v, i), '')
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const [sentenceDetails, risks, tierCalculation, predictors] = await Promise.all([
        masClient.getSentenceDetails(crn, queryParam),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/sentence', {
        sentenceDetails,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
      })
    }
  },
  getProbationHistory: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      const [sentenceDetails, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getProbationHistory(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/probation-history', {
        sentenceDetails,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
      })
    }
  },
  getPreviousOrders: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_PREVIOUS_ORDERS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const previousOrderHistory = await masClient.getSentencePreviousOrders(crn)
      return res.render('pages/sentence/previous-orders', {
        previousOrderHistory,
        crn,
      })
    }
  },
  getPreviousOrderDetails: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, eventNumber } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_PREVIOUS_ORDER',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const previousOrderDetail = await masClient.getSentencePreviousOrder(crn, eventNumber)
      return res.render('pages/sentence/previous-orders/previous-order', {
        previousOrderDetail,
        crn,
      })
    }
  },
  getOffenceDetails: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, eventNumber } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_OFFENCE_DETAILS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const offences = await masClient.getSentenceOffences(crn, eventNumber)
      return res.render('pages/sentence/offences', {
        offences,
        crn,
      })
    }
  },
  getLicenceConditionNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, licenceConditionId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_LICENCE_CONDITION_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      const [licenceNoteDetails, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getSentenceLicenceConditionNote(crn, licenceConditionId, noteId),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const predictorScores = toPredictors(predictors)
      const risksWidget = toRoshWidget(risks)
      return res.render('pages/licence-condition-note', {
        licenceNoteDetails,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
  getRequirementNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, requirementId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_REQUIREMENT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      const [requirementNoteDetails, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getSentenceRequirementNote(crn, requirementId, noteId),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const predictorScores = toPredictors(predictors)
      const risksWidget = toRoshWidget(risks)
      return res.render('pages/requirement-note', {
        requirementNoteDetails,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
}

export default sentenceController
