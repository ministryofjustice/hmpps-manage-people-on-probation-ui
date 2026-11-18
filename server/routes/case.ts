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
  getOasysLink,
  getPersonPhoto,
} from '../middleware'

export default function caseRoutes(router: Router, { hmppsAuthClient, arnsComponents, mpopComponents }: Services) {
  router.get('/person-photo/:nomsNumber', asyncMiddleware(getPersonPhoto(hmppsAuthClient, mpopComponents)))
  router.all(
    ['/case/:crn', '/case/:crn/*path'],
    getOasysLink(),
    getSupervisionPackage(hmppsAuthClient, mpopComponents),
    getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents),
    getPersonRiskFlags(hmppsAuthClient, mpopComponents),
    getTierDetails(hmppsAuthClient, mpopComponents),
    getNextAppointment(hmppsAuthClient, mpopComponents),
  )
  router.get(
    '/case/:crn',
    getTierChangePrompt(hmppsAuthClient),
    asyncMiddleware(controllers.case.getCase(hmppsAuthClient)),
  )
}
