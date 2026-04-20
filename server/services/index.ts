import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { dataAccess } from '../data'
import UserService from './userService'
import FlagService from './flagService'
import TechnicalUpdatesService from './technicalUpdatesService'
import config from '../config'
import ProbationComponentsApiService from './ProbationComponentsService'
import { convertToTitleCase } from '../utils'

const UNALLOCATED: string = 'Unallocated'
export const getPdu = (result: any): string => {
  const activeManager = result?.offenderManagers?.find((item: any) => item?.active)
  if (!activeManager) {
    return UNALLOCATED
  }
  const pdu = activeManager?.team?.borough?.description
  return pdu?.includes(UNALLOCATED) ? UNALLOCATED : convertToTitleCase(pdu) || UNALLOCATED
}

export const getManagedBy = (result: any): string => {
  const activeManager = result?.offenderManagers?.find((item: any) => item?.active)
  if (activeManager?.staff?.unallocated || !activeManager) {
    return UNALLOCATED
  }
  const { forenames, surname } = activeManager.staff || {}

  return [forenames, surname]
    .filter(Boolean)
    .map(s => convertToTitleCase(s))
    .join(' ')
}

export const services = () => {
  const {
    applicationInfo,
    hmppsAuthClient,
    manageUsersApiClient,
    probationFrontendComponentsApiClient,
    arnsComponents,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const searchService = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.env,
    extraColumns: [
      {
        header: 'Managed by',
        value: result => getManagedBy(result),
      },
      {
        header: 'PDU',
        value: result => getPdu(result),
      },
    ],
  })

  const searchServiceWithoutExtraColumns = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.env,
    extraColumns: [],
  })

  const flagService = new FlagService()
  const technicalUpdatesService = new TechnicalUpdatesService()

  const probationComponentsApiService = new ProbationComponentsApiService(probationFrontendComponentsApiClient)

  return {
    applicationInfo,
    hmppsAuthClient,
    userService,
    searchService,
    searchServiceWithoutExtraColumns,
    flagService,
    probationComponentsApiService,
    technicalUpdatesService,
    arnsComponents,
  }
}

export type Services = ReturnType<typeof services>

export { UserService, FlagService }
