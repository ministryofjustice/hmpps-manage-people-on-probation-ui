import logger from '../../logger'
import UserService from '../services/userService'
import { Route } from '../@types'

export default function populateCurrentUser(userService: UserService): Route<Promise<void>> {
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
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user?.username}`)
      next(error)
    }
  }
}
