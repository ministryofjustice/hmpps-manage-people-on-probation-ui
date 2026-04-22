import { EvaluationRequest, EvaluationResponse, FliptEvaluationClient } from '@flipt-io/flipt-client'
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

    const requests: EvaluationRequest[] = flagList.flatMap(flag => {
      const pduCodesForFlag = PDU_GATED_FLAGS.has(flag) && pduCodes.length > 0 ? pduCodes : [undefined]
      return pduCodesForFlag.map(pduCode => {
        logger.info(`Requesting flag ${flag}${pduCode ? ` for ${pduCode}` : ''}`)
        return {
          flagKey: flag,
          entityId: context?.email ? context.email || 'anonymous' : flag,
          context: {
            ...(context?.email ? { email: context.email } : {}),
            ...(pduCode ? { pduCode } : {}),
          },
        }
      })
    })

    const flags = fliptEvaluationClient.evaluateBatch(requests)

    function responsesFor(results: EvaluationResponse[], key: string) {
      return results.filter(r => r.booleanEvaluationResponse?.flagKey === key)
    }

    flagList.forEach(f => {
      const matching = responsesFor(flags.responses, f)
      if (PDU_GATED_FLAGS.has(f)) {
        featureFlags[f] = matching.some(r => r.booleanEvaluationResponse?.enabled === true)
      } else {
        featureFlags[f] = matching[0]?.booleanEvaluationResponse?.enabled === true
      }
      logger.info(`Flag ${f} is ${featureFlags[f]}`)
    })
    return featureFlags
  }
}
