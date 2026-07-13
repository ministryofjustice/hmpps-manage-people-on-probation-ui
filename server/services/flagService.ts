import { EvaluationRequest, EvaluationResponse, FliptEvaluationClient } from '@flipt-io/flipt-client'
import * as Sentry from '@sentry/node'
import config from '../config'
import { FeatureFlags } from '../data/model/featureFlags'
import logger from '../../logger'

const PDU_GATED_FLAGS = new Set(['enableESupervisionCheckins'])
const USERNAME_GATED_FLAGS = new Set(['enableESupervisionCheckins'])

interface FlagContext {
  email?: string
  username?: string
  pduCodes?: string[]
}

export default class FlagService {
  async getFlags(context: FlagContext): Promise<FeatureFlags> {
    const namespace = 'manage-people-on-probation-ui'
    const fliptEvaluationClient = await FliptEvaluationClient.init(namespace, {
      url: config.flipt.url,
      authentication: {
        clientToken: config.flipt.token,
      },
    })
    const flagList: string[] = []
    const featureFlags = new FeatureFlags()
    Object.keys(featureFlags).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(featureFlags, key)) {
        flagList.push(key)
      }
    })

    const pduCodes: string[] = context?.pduCodes ?? []
    const email = context?.email?.toLowerCase()
    const username = context?.username?.toLowerCase()

    const buildRequest = (
      flag: string,
      additionalContext: { pduCode?: string; username?: string } = {},
    ): EvaluationRequest => {
      return {
        flagKey: flag,
        entityId: email || additionalContext.username || flag,
        context: {
          ...(email ? { email } : {}),
          ...additionalContext,
        },
      }
    }

    const requests: EvaluationRequest[] = flagList.flatMap(flag => {
      const isPduGatedFlag = PDU_GATED_FLAGS.has(flag)
      const isUsernameGatedFlag = USERNAME_GATED_FLAGS.has(flag)
      const requestsForFlag: EvaluationRequest[] = []
      if (isPduGatedFlag) {
        requestsForFlag.push(...pduCodes.map(pduCode => buildRequest(flag, { pduCode })))
      }
      if (isUsernameGatedFlag && username) {
        requestsForFlag.push(buildRequest(flag, { username }))
      }
      if (isPduGatedFlag || isUsernameGatedFlag) {
        return requestsForFlag
      }
      return [buildRequest(flag)]
    })

    const flags = fliptEvaluationClient.evaluateBatch(requests)

    function responsesFor(results: EvaluationResponse[], key: string) {
      return results.filter(r => r.booleanEvaluationResponse?.flagKey === key)
    }

    for (const f of flagList) {
      const matching = responsesFor(flags.responses, f)
      if (PDU_GATED_FLAGS.has(f) || USERNAME_GATED_FLAGS.has(f)) {
        featureFlags[f] = matching.some(r => r.booleanEvaluationResponse?.enabled === true)
      } else if (matching.length === 1) {
        featureFlags[f] = matching[0].booleanEvaluationResponse.enabled === true
      } else {
        const message = `Expected exactly 1 response for flag ${f}, got ${matching.length} — defaulting to false`

        logger.warn(message)

        const client = Sentry.getClient()
        if (client) {
          const eventId = Sentry.captureException(new Error(message), {
            tags: {
              flag: f,
              service: 'FlagService',
            },
            extra: {
              matchingLength: matching.length,
            },
          })

          logger.info(`Sentry eventId: ${eventId}`)
        }

        featureFlags[f] = false
      }
    }

    return featureFlags
  }
}
