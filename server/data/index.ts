/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ArnsComponents } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo.applicationName)

// eslint-disable-next-line import/no-cycle
import HmppsAuthClient from './hmppsAuthClient'
import ManageUsersApiClient from './manageUsersApiClient'
import { createRedisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import config from '../config'
import ProbationFrontendComponentsApiClient from './probationFrontendComponentsClient'
import logger from '../../logger'

type RestClientBuilder<T> = (token: string) => T

const authClientArns = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)
export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  ),
  manageUsersApiClient: new ManageUsersApiClient(),
  probationFrontendComponentsApiClient: new ProbationFrontendComponentsApiClient(),
  authClientArns,
  arnsComponents: new ArnsComponents(authClientArns, config.apis.arnsApi, logger),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { HmppsAuthClient, RestClientBuilder, ManageUsersApiClient, ProbationFrontendComponentsApiClient }
