import { EvaluationRequest, EvaluationResponse, FliptEvaluationClient } from '@flipt-io/flipt-client'
import { getConfig } from '../config'
import { FeatureFlags } from '../data/model/featureFlags'

export default class FlagService {
  async getFlags(): Promise<FeatureFlags> {
    const config = getConfig()
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
    const requests = flagList.map(flag => {
      const request: EvaluationRequest = { flagKey: flag, entityId: flag, context: {} }
      return request
    })
    const flags = fliptEvaluationClient.evaluateBatch(requests)

    function result(results: EvaluationResponse[], key: string) {
      const filtered = results.filter(flag => flag.booleanEvaluationResponse?.flagKey === key)
      if (filtered.length === 1) {
        return filtered[0].booleanEvaluationResponse.enabled
      }
      return false
    }

    flagList.forEach(f => {
      featureFlags[f] = result(flags.responses, f)
    })

    return featureFlags
  }
}
