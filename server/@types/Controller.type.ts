/* eslint-disable import/no-cycle */
import { HmppsAuthClient } from '../data'
import { Route } from '.'

export type Controller<T extends readonly string[], TArgs = any> = {
  [K in T[number]]: (hmppsAuthClient?: HmppsAuthClient) => Route<Promise<void>, TArgs>
}
