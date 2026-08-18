import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import controllers from '../controllers'
import {
  getPersonalDetails,
  getPersonRiskFlags,
  getTierDetails,
  getTierChangePrompt,
  getSupervisionPackage,
  getNextAppointment,
} from '../middleware'

export default function caseRoutes(router: Router, { hmppsAuthClient, arnsComponents, mpopComponents }: Services) {
  router.all(
    ['/case/:crn', '/case/:crn/*path'],
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getPersonRiskFlags(hmppsAuthClient),
    getTierDetails(hmppsAuthClient, mpopComponents),
    getSupervisionPackage(hmppsAuthClient, mpopComponents),
    getNextAppointment(hmppsAuthClient, mpopComponents),
  )
  router.get(
    '/case/:crn',
    getTierChangePrompt(hmppsAuthClient),
    asyncMiddleware(controllers.case.getCase(hmppsAuthClient)),
  )
}
