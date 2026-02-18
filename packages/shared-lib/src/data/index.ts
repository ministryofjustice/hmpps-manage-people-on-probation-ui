/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo.applicationName)

import HmppsAuthClient from './hmppsAuthClient'
import ManageUsersApiClient from './manageUsersApiClient'
import { createRedisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import { getConfig } from '../config'
import ProbationFrontendComponentsApiClient from './probationFrontendComponentsClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => {
  const config = getConfig()
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
