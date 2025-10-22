import config from '../config'

// eslint-disable-next-line import/no-cycle
import RestClient from './restClient'
import { AvailableComponent, ComponentsResponse } from '../@types/probationComponent'

export default class ProbationFrontendComponentsApiClient {
  private static restClient(token: string): RestClient {
    return new RestClient('Probation Frontend Components API', config.apis.probationFrontendComponentsApi, token)
  }

  getComponents<T extends AvailableComponent[]>(components: T, userToken: string): Promise<ComponentsResponse> {
    const queryStr = `?${components.join('&')}`
    return ProbationFrontendComponentsApiClient.restClient(userToken).get<ComponentsResponse>({
      path: '/api/components',
      query: `component=${queryStr}`,
      headers: { 'x-user-token': userToken },
    })
  }
}
