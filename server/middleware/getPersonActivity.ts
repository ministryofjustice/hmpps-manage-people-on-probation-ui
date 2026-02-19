import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { PersonActivity } from '../data/model/activityLog'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'
import { toIsoDateFromPicker, toCamelCase } from '../utils'
import { AppResponse } from '../models/Locals'
import { ActivityLogRequestBody } from '../models/ActivityLog'

export const getPersonActivity = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<[TierCalculation, PersonActivity]> => {
  const { filters } = res.locals
  const { params, query } = req
  const { keywords, dateFrom, dateTo, compliance } = filters
  const { crn } = params as Record<string, string> as Record<string, string>
  const { page = '0' } = query
  const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const masClient = new MasApiClient(token)
  const tierClient = new TierApiClient(token)

  const body: ActivityLogRequestBody = {
    keywords,
    dateFrom: dateFrom ? toIsoDateFromPicker(dateFrom) : '',
    dateTo: dateTo ? toIsoDateFromPicker(dateTo) : '',
    filters: compliance ? compliance.map(option => toCamelCase(option)) : [],
  }
  const size = res.locals.flags.enableContactLog ? '25' : '10'
  const [personActivity, tierCalculation] = await Promise.all([
    masClient.postPersonActivityLog(crn, body, page as string, size),
    tierClient.getCalculationDetails(crn),
  ])

  return [tierCalculation, personActivity]
}
