import config from '../config'
import RestClient from './restClient'
import { QueriesRequest, QueriesResponse, SentencePlanResult } from './model/arnsAssessmentPlatform'
import logger from '../../logger'

export default class ArnsAssessmentPlatformApiClient extends RestClient {
  constructor(token: string) {
    super('ARNS Assessment Platform API', config.apis.arnsAssessmentPlatformApi, token)
  }

  async getSentencePlanByCrn(crn: string, username: string): Promise<SentencePlanResult | null> {
    const request: QueriesRequest = {
      queries: [
        {
          type: 'AssessmentVersionQuery',
          user: { id: username, name: username, authSource: 'HMPPS_AUTH' },
          assessmentIdentifier: {
            type: 'EXTERNAL',
            identifier: crn,
            identifierType: 'CRN',
            assessmentType: 'SENTENCE_PLAN',
          },
        },
      ],
    }

    try {
      const response = await this.post<QueriesResponse>({
        path: '/query',
        data: request as unknown as Record<string, unknown>,
        handle404: true,
      })

      const result = response?.queries?.[0]?.result
      if (!result) {
        return null
      }

      return { hasPlan: true, lastUpdatedDate: result.updatedAt }
    } catch (error) {
      logger.error(error.name, 'Failed to get sentence plan from Assessment Platform API')

      return null
    }
  }
}
