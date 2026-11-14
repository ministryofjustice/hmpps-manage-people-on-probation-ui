import { HmppsAuthClient } from '../data'
import { Route } from './Route.type'

export type Controller<T extends readonly string[], TResponse, TArgs = unknown> = {
  [K in T[number]]: (hmppsAuthClient?: HmppsAuthClient) => Route<Promise<TResponse>, TArgs>
}
