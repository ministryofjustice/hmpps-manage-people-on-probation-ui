import logger from '../logger'
import UserService from '../services/userService'
import { Route } from '../types/Route'

export default function populateCurrentUser(userService: UserService): Route<Promise<void | null>> {
  return async (_req, res, next) => {
    try {
      if (res.locals.user) {
        const user = res.locals.user && (await userService.getUser(res.locals.user.token))
        if (user) {
          res.locals.user = { ...user, ...res.locals.user }
        } else {
          logger.info('No user available')
        }
      }
      if (next) {
        return next()
      }
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user?.username}`)
      if (next) {
        next(error)
      }
    }
    return null
  }
}
