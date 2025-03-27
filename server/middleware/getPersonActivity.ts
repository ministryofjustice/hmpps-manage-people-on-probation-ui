import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { ActivityLogRequestBody, AppResponse } from '../@types'
import { PersonActivity } from '../data/model/activityLog'
import { toIsoDate, toCamelCase } from '../utils/utils'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'

export const getPersonActivity = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<[TierCalculation, PersonActivity]> => {
  const { params, query } = req
  const compliance: string[] = req.session?.activityLogFilters?.compliance
  const { keywords, dateFrom, dateTo } = req.session?.activityLogFilters ?? {
    keywords: '',
    dateFrom: '',
    dateTo: '',
  }
  const { crn } = params
  const { page = '0' } = query
  const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const masClient = new MasApiClient(token)
  const tierClient = new TierApiClient(token)

  const body: ActivityLogRequestBody = {
    keywords,
    dateFrom: dateFrom ? toIsoDate(dateFrom) : '',
    dateTo: dateTo ? toIsoDate(dateTo) : '',
    filters: compliance ? compliance.map(option => toCamelCase(option)) : [],
  }
  const [personActivity, tierCalculation] = await Promise.all([
    masClient.postPersonActivityLog(crn, body, page as string),
    tierClient.getCalculationDetails(crn),
  ])

  return [tierCalculation, personActivity]
}
