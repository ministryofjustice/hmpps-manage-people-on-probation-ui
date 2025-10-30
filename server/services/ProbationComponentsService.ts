import ProbationFrontendComponentsApiClient from '../data/probationFrontendComponentsClient'

import { AvailableComponent, Component } from '../@types/probationComponent'
import logger from '../../logger'

export default class ProbationComponentsService {
  constructor(private readonly probationFEComponentsClient: ProbationFrontendComponentsApiClient) {}

  async getProbationFEComponents<T extends AvailableComponent[]>(
    components: T,
    token: string,
  ): Promise<Record<T[number], Component>> {
    logger.info('Getting FE details  : calling Probation FE components API')
    return this.probationFEComponentsClient.getComponents(components, token)
  }
}
