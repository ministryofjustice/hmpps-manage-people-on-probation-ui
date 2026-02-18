import ProbationFrontendComponentsApiClient from '../data/probationFrontendComponentsClient'
import { AvailableComponent, ComponentsResponse } from '../types/probationComponent'
import logger from '../logger'

export default class ProbationComponentsService {
  constructor(private readonly probationFEComponentsClient: ProbationFrontendComponentsApiClient) {}

  async getProbationFEComponents<T extends AvailableComponent[]>(
    components: T,
    token: string,
  ): Promise<ComponentsResponse> {
    logger.info('Getting FE details  : calling Probation FE components API')
    return this.probationFEComponentsClient.getComponents(components, token)
  }
}
