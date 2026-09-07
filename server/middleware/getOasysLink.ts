import { Route } from '../@types'
import config from '../config'

export const getOasysLink = (): Route<void> => {
  return function getOasysLinkInner(_, res, next) {
    res.locals.oasysLink = config.oaSys.link
    next()
  }
}
