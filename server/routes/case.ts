import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  getPersonalDetails,
  getPersonRiskFlags,
  getTierDetails,
  getSupervisionPackage,
  getNextAppointment,
} from '../middleware'

export default function caseRoutes(router: Router, { hmppsAuthClient, arnsComponents, mpopComponents }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all(
    ['/case/:crn', '/case/:crn/*path'],
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getPersonRiskFlags(hmppsAuthClient),
    getTierDetails(hmppsAuthClient, mpopComponents),
    getSupervisionPackage(hmppsAuthClient, mpopComponents),
    getNextAppointment(hmppsAuthClient, mpopComponents),
  )
  get('/case/:crn', controllers.case.getCase(hmppsAuthClient))
}
