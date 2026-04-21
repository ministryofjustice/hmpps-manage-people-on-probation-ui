import logger from '../../logger'
import UserService from '../services/userService'
import { Route } from '../@types'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'

export default function populateCurrentUser(
  userService: UserService,
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<void>> {
  return async (_req, res, next) => {
    try {
      if (res.locals.user) {
        let localsUser = res.locals.user
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        const [user, userDetails] = await Promise.all([
          userService.getUser(res.locals.user.token),
          masClient.getUserDetails(res.locals.user.username),
        ])
        if (user) {
          localsUser = { ...user, ...localsUser }
        } else {
          logger.info('No user available')
        }
        if (userDetails) {
          localsUser = { ...userDetails, ...localsUser, userId: userDetails?.userId?.toString() }
        } else {
          logger.info('No user details available')
        }
        res.locals.user = localsUser
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user?.username}`)
      next(error)
    }
  }
}
