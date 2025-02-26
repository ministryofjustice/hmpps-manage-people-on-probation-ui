import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { ActivityLogRequestBody, AppResponse } from '../@types'
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

  return [tierCalculation, personActivity]
}
