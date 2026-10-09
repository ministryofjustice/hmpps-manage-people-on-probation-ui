import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts, UserAlertsContent } from '../models/Alerts'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, getRiskRoshScore } from '../utils'
import {
  CrnToRiskWidgetMap,
  PersonRiskFlags,
  RiskInfo,
  RiskSummary,
  RoshBadgeLevel,
  RoshRiskWidgetDto,
} from '../data/model/risk'
import { ErrorSummary, ErrorSummaryItem } from '../data/model/common'
import logger from '../../logger'
import { apiErrors } from '../properties'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getAlerts', 'getAlertNote', 'clearSelectedAlerts'] as const

interface RestClientError {
  status: number
  errors: ErrorSummaryItem[]
}

export interface RiskRoshScoreMap {
  [crn: string]: RoshBadgeLevel | null
}

interface Params {
  note: boolean
  queryString: string
  url: string
  back: string
  alertsData: UserAlerts
  crnToRiskWidgetMap?: CrnToRiskWidgetMap
  riskRoshScoreMap?: RiskRoshScoreMap
  pagination?: Pagination
  sortedBy: string
  risksErrors: ErrorSummaryItem[]
}

const responseIsError = (response: RiskSummary | PersonRiskFlags): response is RestClientError => {
  return (response as RestClientError)?.errors !== undefined
}

const getRiskRoshScoreMap = async (
  alertsData: UserAlertsContent[],
  masClient: MasApiClient,
): Promise<{ riskRoshScoreMap: RiskRoshScoreMap; risksErrors: ErrorSummaryItem[] }> => {
  if (!alertsData[0]) {
    return { riskRoshScoreMap: {}, risksErrors: [] }
  }
  let allPersonRiskFlagsResponses: Array<PersonRiskFlags | ErrorSummary> = []
  let masUnavailableError: string = null
  let riskRoshScoreMap: RiskRoshScoreMap = {}
  let risksErrors: ErrorSummaryItem[] = []
  const uniqueCrns = [...new Set(alertsData.map(item => item.crn))].filter(Boolean)
  try {
    allPersonRiskFlagsResponses = await Promise.all(uniqueCrns.map(crn => masClient.getPersonRiskFlags(crn)))
    const responseErrorIndex = allPersonRiskFlagsResponses.findIndex(riskResponse => responseIsError(riskResponse))
    if (responseErrorIndex >= 0) {
      masUnavailableError = (allPersonRiskFlagsResponses[responseErrorIndex] as ErrorSummary).errors[0].text
    }
    if (!masUnavailableError && allPersonRiskFlagsResponses?.length) {
      riskRoshScoreMap = (allPersonRiskFlagsResponses as PersonRiskFlags[]).reduce(
        (acc, personRiskFlagsResponse, i) => {
          return {
            ...acc,
            [uniqueCrns[i]]: getRiskRoshScore(personRiskFlagsResponse?.riskFlags),
          }
        },
        {},
      )
    }
  } catch (err: any) {
    const error = err as Error
    logger.error(error.message)
    masUnavailableError = apiErrors.personRiskFlags
  }
  if (masUnavailableError) {
    risksErrors = [{ text: masUnavailableError }]
  }
  return { riskRoshScoreMap, risksErrors }
}

const getCrnRiskMap = async (alertsData: UserAlertsContent[], arnsClient: ArnsApiClient): Promise<RiskInfo> => {
  if (!alertsData[0]) {
    return { crnToRiskWidgetMap: {}, risksErrors: [] }
  }

  let allRiskResponses: RiskSummary[] = []
  let arnsUnavailableError: string = null
  let results: { crn: string; risksWidget: RoshRiskWidgetDto | string }[] = []
  let risksErrors: { text: string }[] = []
  let crnToRiskWidgetMap: CrnToRiskWidgetMap = {}

  const uniqueCrns = [...new Set(alertsData.map(item => item.crn))].filter(Boolean)

  try {
    allRiskResponses = await Promise.all(uniqueCrns.map(crn => arnsClient.getRisks(crn)))
    // promise.all will complete and resolve even if response of any request is a 500 error, so check for error
    const responseErrorIndex = allRiskResponses.findIndex(riskResponse => responseIsError(riskResponse))
    if (responseErrorIndex >= 0) arnsUnavailableError = allRiskResponses[responseErrorIndex].errors[0].text
  } catch (err: any) {
    logger.error(err.message)
    arnsUnavailableError = apiErrors.risks
  }
  if (allRiskResponses.length) {
    results = allRiskResponses.map((riskResponse, i) => ({
      crn: uniqueCrns[i],
      risksWidget: arnsUnavailableError ?? toRoshWidget(riskResponse),
    }))
    crnToRiskWidgetMap = results.reduce((acc, { crn, risksWidget }) => ({ ...acc, [crn]: risksWidget }), {})
  }
  if (arnsUnavailableError) {
    risksErrors = [{ text: arnsUnavailableError }]
  }
  return { crnToRiskWidgetMap, risksErrors }
}

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async function getAlerts(req, res) {
      const { user } = res.locals
      const { back } = req.query as Record<string, string>
      const url = encodeURIComponent(req.url)
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      const queryString = req.url.split('?')[1]
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date_and_time.desc'
      const [sortName, sortDirection] = sortedBy.split('.')
      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)
      await sendAuditMessage(res, 'VIEW_MAS_ALERT', user.username, SubjectType.USER)

      const alertsData: UserAlerts = await masClient.getUserAlerts(
        pageNum - 1,
        sortName.toUpperCase(),
        sortDirection as 'asc' | 'desc',
      )

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        alertsData?.totalPages || 0,
        alertsData?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        alertsData?.size || 10,
      )

      const arnsClient = new ArnsApiClient(token)
      let crnToRiskWidgetMap: CrnToRiskWidgetMap
      let riskRoshScoreMap: RiskRoshScoreMap
      let risksErrors: ErrorSummaryItem[]
      const params: Params = {
        note: false,
        queryString,
        url,
        back,
        alertsData,
        pagination,
        sortedBy,
        risksErrors: null,
      }
      if (res.locals?.flags?.enableNDeliusRosh) {
        ;({ riskRoshScoreMap, risksErrors } = await getRiskRoshScoreMap(alertsData.content, masClient))
        params.riskRoshScoreMap = riskRoshScoreMap
      } else {
        ;({ crnToRiskWidgetMap, risksErrors } = await getCrnRiskMap(alertsData.content, arnsClient))
        params.crnToRiskWidgetMap = crnToRiskWidgetMap
      }
      params.risksErrors = risksErrors
      res.render('pages/alerts', params)
    }
  },

  getAlertNote: hmppsAuthClient => {
    return async function getAlertNote(req, res) {
      const { contactId, noteId } = req.params as Record<string, string>
      const { back } = req.query as Record<string, string>
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date_and_time.desc'
      const url = encodeURIComponent(req.url)
      const queryString = req.url.split('?')[1]

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await sendAuditMessage(res, 'VIEW_MAS_ALERT_NOTE', res.locals.user.username, SubjectType.USER)
      const alertNote: UserAlertsContent = await masClient.getUserAlertNote(contactId, noteId)
      const alertsData: UserAlerts = { content: [alertNote] }

      const arnsClient = new ArnsApiClient(token)
      let crnToRiskWidgetMap: CrnToRiskWidgetMap
      let riskRoshScoreMap: RiskRoshScoreMap
      let risksErrors: ErrorSummaryItem[]

      const params: Params = {
        note: true,
        back,
        queryString,
        url,
        alertsData,
        sortedBy,
        risksErrors: null,
      }

      if (res.locals?.flags?.enableNDeliusRosh) {
        ;({ riskRoshScoreMap, risksErrors } = await getRiskRoshScoreMap(alertsData.content, masClient))
        params.riskRoshScoreMap = riskRoshScoreMap
      } else {
        ;({ crnToRiskWidgetMap, risksErrors } = await getCrnRiskMap(alertsData.content, arnsClient))
        params.crnToRiskWidgetMap = crnToRiskWidgetMap
      }
      params.risksErrors = risksErrors
      res.render('pages/alerts', params)
    }
  },

  clearSelectedAlerts: hmppsAuthClient => {
    return async function clearSelectedAlerts(req, res, next) {
      const { user } = res.locals
      const { selectedAlerts } = req.body
      await sendAuditMessage(res, 'EDIT_MAS_CLEAR_ALERT', res.locals.user.username, SubjectType.USER)

      if (!selectedAlerts || selectedAlerts.length === 0) {
        res.locals.alertsCleared = { error: true, message: `Select an alert to clear it.` }
        return next()
      }

      // Convert to array of numbers
      const alertIds = Array.isArray(selectedAlerts)
        ? selectedAlerts.map((id: string) => Number.parseInt(id, 10))
        : [Number.parseInt(selectedAlerts, 10)]

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      await masClient.clearAlerts(alertIds)
      const alertCount = alertIds.length
      res.locals.alertsCleared = {
        error: false,
        message: `You've cleared ${alertCount} ${alertCount > 1 ? 'alerts' : 'alert'}.`,
      }
      delete req.query.page
      req.url = '/alerts'
      return next()
    }
  },
}

export default alertsController
