import { Router } from 'express'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import populateCurrentUser from './populateCurrentUser'
import type { Services } from '../services'

export const setUpCurrentUser = ({ userService }: Services): Router => {
  const router = Router({ mergeParams: true })
  router.use(auth.authenticationMiddleware(tokenVerifier))
  // @ts-expect-error TS ERROR BELOW TO FIX
  router.use(populateCurrentUser(userService))
  return router
}
