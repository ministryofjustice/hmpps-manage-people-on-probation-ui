/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

import HmppsAuthClient from './hmppsAuthClient'
import ManageUsersApiClient from './manageUsersApiClient'
import { createRedisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import config from '../config'
import ProbationFrontendComponentsApiClient from './probationFrontendComponentsClient'

type RestClientBuilder<T> = (token: string) => T

export const appInsightsClient = () => {
  const applicationInfo = applicationInfoSupplier()
  initialiseAppInsights()
  buildAppInsightsClient(applicationInfo.applicationName)
}

export const dataAccess = () => {
  const applicationInfo = applicationInfoSupplier()
  return {
    applicationInfo,
    hmppsAuthClient: new HmppsAuthClient(
      config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
    ),
    manageUsersApiClient: new ManageUsersApiClient(),
    probationFrontendComponentsApiClient: new ProbationFrontendComponentsApiClient(),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export { HmppsAuthClient, RestClientBuilder, ManageUsersApiClient, ProbationFrontendComponentsApiClient }
