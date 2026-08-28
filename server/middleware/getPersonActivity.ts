import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { PersonActivity } from '../data/model/activityLog'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'
import { toIsoDateFromPicker, toCamelCase } from '../utils'
import { AppResponse } from '../models/Locals'
import { ActivityLogRequestBody, SelectedFilterItem } from '../models/ActivityLog'
import {
  categoryFilterOptions,
  sparksCategoryFilterOption,
  supervisionPackageCategoryFilterOption,
  supervisionPackageAppointmentsCategoryFilterOption,
  ACTIVITY_LOG_PAGE_SIZE,
} from '../properties'

export const getPersonActivity = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<[TierCalculation, PersonActivity]> => {
  const { filters } = res.locals
  const { params, query } = req
  const {
    keywords,
    dateFrom,
    dateTo,
    compliance,
    category,
    sparks,
    supervisionPackage,
    supervisionPackageAppointments,
    hideContact,
  } = filters
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

  const filterBySparksContacts =
    res.locals.flags?.enableSparksFilter === true &&
    Array.isArray(sparks) &&
    sparks.includes(sparksCategoryFilterOption.value)

  const filterBySupervisionPackageContacts =
    res.locals.flags?.enableSupervisionPackageFilter === true &&
    Array.isArray(supervisionPackage) &&
    supervisionPackage.includes(supervisionPackageCategoryFilterOption.value)

  const filterBySupervisionPackageAppointmentsContacts =
    res.locals.flags?.enableSupervisionPackageAppointments === true &&
    Array.isArray(supervisionPackageAppointments) &&
    supervisionPackageAppointments.includes(supervisionPackageAppointmentsCategoryFilterOption.value)

  const formatCompliance = (): Array<string> => {
    const complianceArray: string[] = []

    if (compliance && Array.isArray(compliance)) {
      compliance.forEach(option => complianceArray.push(toCamelCase(option)))
    } else if (compliance && typeof compliance === 'string') {
      complianceArray.push(compliance)
    }

    return complianceArray
  }

  const body: ActivityLogRequestBody = {
    keywords,
    dateFrom: dateFrom ? toIsoDateFromPicker(dateFrom) : '',
    dateTo: dateTo ? toIsoDateFromPicker(dateTo) : '',
    filters: [...formatCompliance()],
    filterBySparksContacts,
    filterBySupervisionPackageContacts,
    filterBySupervisionPackageAppointmentsContacts,
    includeSystemGenerated: hideContact?.length === 0,
    typeCodes: combinedCategoryCodes,
  }
  const size = String(ACTIVITY_LOG_PAGE_SIZE)
  const useSemanticSearch = res.locals.flags?.enableSemanticSearch === true
  const [personActivity, tierCalculation] = await Promise.all([
    masClient.postPersonActivityLog(crn, body, page as string, size, useSemanticSearch),
    tierClient.getCalculationDetails(crn),
  ])

  return [tierCalculation, personActivity]
}
