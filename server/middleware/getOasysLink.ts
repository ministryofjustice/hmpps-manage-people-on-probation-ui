import { Route } from '../@types'
import config from '../config'

export const getOasysLink = (): Route<void> => {
  return function getOasysLinkInner(req, res, next) {
    console.log('Setting oasysLink on res.locals', config.oaSys.link)
    res.locals.oasysLink = config.oaSys.link
    next()
  }
}
