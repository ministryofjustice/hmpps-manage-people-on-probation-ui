/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ArnsComponents } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
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
import config from '../config'
import ProbationFrontendComponentsApiClient from './probationFrontendComponentsClient'
import logger from '../../logger'

type RestClientBuilder<T> = (token: string) => T

const authClientArns = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)
const authClientSearch = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)

const authClientMpop = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  ),
  authClientSearch,
  manageUsersApiClient: new ManageUsersApiClient(),
  probationFrontendComponentsApiClient: new ProbationFrontendComponentsApiClient(),
  authClientArns,
  arnsComponents: new ArnsComponents(authClientArns, config.apis.arnsApi, logger),
  authClientMpop,
  mpopComponents: new MPoPComponents(
    authClientMpop,
    {
      ...config.apis.tierApi,
      masApiConfig: config.apis.masApi,
      supervisionPackageApiConfig: config.apis.supervisionPackageApi,
    },
    logger,
  ),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { HmppsAuthClient, RestClientBuilder, ManageUsersApiClient, ProbationFrontendComponentsApiClient }
