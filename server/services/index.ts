import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { dataAccess } from '../data'
import UserService from './userService'
import FlagService from './flagService'
import config from '../config'
import ProbationComponentsApiService from './ProbationComponentsService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient, probationFrontendComponentsApiClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const searchService = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.env,
    extraColumns: [],
  })

  const flagService = new FlagService()

  const probationComponentsApiService = new ProbationComponentsApiService(probationFrontendComponentsApiClient)

  return {
    applicationInfo,
    hmppsAuthClient,
    userService,
    searchService,
    flagService,
    probationComponentsApiService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService, FlagService }
