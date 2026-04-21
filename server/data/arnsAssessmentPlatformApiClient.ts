import config from '../config'
import RestClient from './restClient'
import { QueriesRequest, QueriesResponse, SentencePlanResult, unwrapSingleValue } from './model/arnsAssessmentPlatform'
import logger from '../../logger'

const DRAFT_STATUS = 'DRAFT'

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
      })

      const result = response?.queries?.[0]?.result
      if (!result) {
        return null
      }

      const planAgreementsCollection = result.collections?.find(c => c.name === 'PLAN_AGREEMENTS')
      if (!planAgreementsCollection?.items?.length) {
        return { hasAgreedPlan: false, lastUpdatedDate: result.updatedAt }
      }

      const sortedItems = [...planAgreementsCollection.items].sort((a, b) => {
        const dateA = unwrapSingleValue(a.properties?.status_date) ?? ''
        const dateB = unwrapSingleValue(b.properties?.status_date) ?? ''

        return dateB.localeCompare(dateA)
      })

      const latestStatus = unwrapSingleValue(sortedItems[0].properties?.status)
      const hasAgreedPlan = !!latestStatus && latestStatus !== DRAFT_STATUS

      return { hasAgreedPlan, lastUpdatedDate: result.updatedAt }
    } catch (error) {
      logger.error(error, 'Failed to get sentence plan from Assessment Platform API')

      return null
    }
  }
}
