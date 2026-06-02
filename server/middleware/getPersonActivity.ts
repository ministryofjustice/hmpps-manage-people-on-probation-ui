import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { PersonActivity } from '../data/model/activityLog'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'
import { toIsoDateFromPicker, toCamelCase } from '../utils'
import { AppResponse } from '../models/Locals'
import { ActivityLogRequestBody, SelectedFilterItem } from '../models/ActivityLog'
import { categoryFilterOptions, ACTIVITY_LOG_PAGE_SIZE } from '../properties'

export const getPersonActivity = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<[TierCalculation, PersonActivity]> => {
  const { filters } = res.locals
  const { params, query } = req
  const { keywords, dateFrom, dateTo, compliance, category, hideContact } = filters
  const { crn } = params as Record<string, string>
  const { page = '0' } = query
  const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const masClient = new MasApiClient(token)
  const tierClient = new TierApiClient(token)

  const combinedCategoryCodes: string[] = []
  if (Array.isArray(category)) {
    for (const val of category) {
      combinedCategoryCodes.push(...(categoryFilterOptions.find(option => option.value === val)?.codes || []))
    }
  }

  let complianceArray: string[]

  if (Array.isArray(compliance)) {
    complianceArray = compliance
  } else if (compliance) {
    complianceArray = [compliance]
  } else {
    complianceArray = []
  }

  const body: ActivityLogRequestBody = {
    keywords,
    dateFrom: dateFrom ? toIsoDateFromPicker(dateFrom) : '',
    dateTo: dateTo ? toIsoDateFromPicker(dateTo) : '',
    filters: complianceArray,
    includeSystemGenerated: hideContact?.length === 0,
    typeCodes: combinedCategoryCodes,
  }
  const size = String(ACTIVITY_LOG_PAGE_SIZE)
  const [personActivity, tierCalculation] = await Promise.all([
    masClient.postPersonActivityLog(crn, body, page as string, size),
    tierClient.getCalculationDetails(crn),
  ])

  return [tierCalculation, personActivity]
}
