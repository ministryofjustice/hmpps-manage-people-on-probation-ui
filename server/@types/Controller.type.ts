import { HmppsAuthClient } from '../data'
import { Route } from './Route.type'

export type Controller<T extends readonly string[], TArgs = any> = {
  [K in T[number]]: (hmppsAuthClient?: HmppsAuthClient) => Route<Promise<void>, TArgs>
}
