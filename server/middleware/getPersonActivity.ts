import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { ActivityLogCacheItem, ActivityLogRequestBody, AppResponse } from '../@types'
import { PersonActivity } from '../data/model/activityLog'
import { toISODate, toCamelCase } from '../utils/utils'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'

export const getPersonActivity = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<[TierCalculation, PersonActivity]> => {
  const { filters } = res.locals
  const { params, query } = req
  const { keywords, dateFrom, dateTo, compliance } = filters
  const { crn } = params
  const { page = '0' } = query
  const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const masClient = new MasApiClient(token)
  const tierClient = new TierApiClient(token)

  let personActivity: PersonActivity | null = null
  let tierCalculation: TierCalculation | null = null
  if (req?.body?.submit && req?.session?.cache?.activityLog?.results) {
    const cache: ActivityLogCacheItem | undefined = req.session.cache.activityLog.results.find(
      cacheItem =>
        crn === cacheItem.crn &&
        keywords === cacheItem.keywords &&
        dateFrom === cacheItem.dateFrom &&
        dateTo === cacheItem.dateTo &&
        compliance.every(option => cacheItem.compliance.includes(option)) &&
        cacheItem.compliance.length === compliance.length &&
        parseInt(page as string, 10) === cacheItem.personActivity.page,
    )
    if (cache) {
      personActivity = cache.personActivity
      tierCalculation = cache.tierCalculation
    }
  }
  if (!personActivity) {
    const body: ActivityLogRequestBody = {
      keywords,
      dateFrom: dateFrom ? toISODate(dateFrom) : '',
      dateTo: dateTo ? toISODate(dateTo) : '',
      filters: compliance ? compliance.map(option => toCamelCase(option)) : [],
    }
    ;[personActivity, tierCalculation] = await Promise.all([
      masClient.postPersonActivityLog(crn, body, page as string),
      tierClient.getCalculationDetails(crn),
    ])
    const newCache: ActivityLogCacheItem[] = [
      ...(req?.session?.cache?.activityLog?.results || []),
      {
        crn,
        keywords,
        dateFrom,
        dateTo,
        compliance,
        personActivity,
        tierCalculation,
      },
    ]
    req.session.cache = {
      ...(req?.session?.cache || {}),
      activityLog: {
        ...(req?.session?.cache?.activityLog || {}),
        results: newCache,
      },
    }
  }
  return [tierCalculation, personActivity]
}
