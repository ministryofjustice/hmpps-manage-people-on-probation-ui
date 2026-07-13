import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { LicenceCondition, Requirement } from '../data/model/sentenceDetails'
import { checkLocationMonitoring } from '../middleware/checkLocationMonitoring'
import { existsInEMDI } from '../middleware/existsInEMDI'
import { PersonExistsResponse } from '../data/emdiClient'

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

const sentenceController: Controller<typeof routes, void> = {
  getSentence: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
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
      const sentenceDetails = await masClient.getSentenceDetails(crn, queryParam)
      let personExistsResponse: PersonExistsResponse | undefined
      if (res.locals.flags.enableEMDISentencesShowGPSData) {
        const licenceConditions: LicenceCondition[] = sentenceDetails.sentence?.licenceConditions
        const requirements: Requirement[] = sentenceDetails.sentence?.requirements
        const hasLocationMonitoring: {
          hasLicenceConditionsLMData?: boolean
          hasRequirementsLMData?: boolean
        } = checkLocationMonitoring(licenceConditions, requirements)
        if (hasLocationMonitoring?.hasLicenceConditionsLMData || hasLocationMonitoring?.hasRequirementsLMData) {
          personExistsResponse = await existsInEMDI(crn, token)
          res.locals.personExistsResponse = personExistsResponse
        }
      }
      return res.render('pages/sentence', {
        sentenceDetails,
        crn,
        locationMonitoringUri: personExistsResponse?.uri,
      })
    }
  },
  getProbationHistory: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
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
      const sentenceDetails = await masClient.getProbationHistory(crn)
      return res.render('pages/probation-history', {
        sentenceDetails,
        crn,
      })
    }
  },
  getPreviousOrders: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
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
      const { crn, eventNumber } = req.params as Record<string, string>
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
      const { crn, eventNumber } = req.params as Record<string, string>
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
      const { crn, licenceConditionId, noteId } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_LICENCE_CONDITION_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const licenceNoteDetails = await masClient.getSentenceLicenceConditionNote(crn, licenceConditionId, noteId)
      return res.render('pages/licence-condition-note', {
        licenceNoteDetails,
        crn,
      })
    }
  },
  getRequirementNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, requirementId, noteId } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_REQUIREMENT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const requirementNoteDetails = await masClient.getSentenceRequirementNote(crn, requirementId, noteId)
      return res.render('pages/requirement-note', {
        requirementNoteDetails,
        crn,
      })
    }
  },
}

export default sentenceController
