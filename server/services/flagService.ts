import { EvaluationRequest, EvaluationResponse, FliptEvaluationClient } from '@flipt-io/flipt-client'
import * as Sentry from '@sentry/node'
import config from '../config'
import { FeatureFlags } from '../data/model/featureFlags'
import logger from '../../logger'

const PDU_GATED_FLAGS = new Set(['enableESupervisionCheckins'])

export default class FlagService {
  async getFlags(context: { email?: string; pduCodes?: string[] }): Promise<FeatureFlags> {
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

    const buildRequest = (flag: string, pduCode?: string): EvaluationRequest => {
      return {
        flagKey: flag,
        entityId: context?.email ? context.email.toLowerCase() || 'anonymous' : flag,
        context: {
          ...(context?.email ? { email: context.email.toLowerCase() } : {}),
          ...(pduCode ? { pduCode } : {}),
        },
      }
    }

    const requests: EvaluationRequest[] = flagList.flatMap(flag => {
      if (PDU_GATED_FLAGS.has(flag)) {
        return pduCodes.map(pduCode => buildRequest(flag, pduCode))
      }
      return [buildRequest(flag)]
    })

    const flags = fliptEvaluationClient.evaluateBatch(requests)

    function responsesFor(results: EvaluationResponse[], key: string) {
      return results.filter(r => r.booleanEvaluationResponse?.flagKey === key)
    }

    for (const f of flagList) {
      const matching = responsesFor(flags.responses, f)
      if (PDU_GATED_FLAGS.has(f)) {
        featureFlags[f] = matching.some(r => r.booleanEvaluationResponse?.enabled === true)
      } else if (matching.length === 1) {
        featureFlags[f] = matching[0].booleanEvaluationResponse.enabled === true
      } else {
        const message = `No flags found. Expected exactly 1 response for flag ${f}, got ${matching.length} — defaulting to false`

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
