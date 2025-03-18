import { type RequestHandler, Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import logger from '../../logger'
import { ErrorMessages } from '../data/model/caseload'
import TierApiClient from '../data/tierApiClient'
import type { Route } from '../@types'
import { toPredictors, toRoshWidget } from '../utils/utils'
import ArnsApiClient from '../data/arnsApiClient'
import {
  appointments,
  appointmentsPost,
  appointmentDetails,
  recordAnOutcome,
  recordAnOutcomePost,
} from '../controllers/renders/appointments'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', appointments(hmppsAuthClient))

  post('/case/:crn/appointments', appointmentsPost)

  get('/case/:crn/appointments/appointment/:contactId', appointmentDetails(hmppsAuthClient))

  get('/case/:crn/record-an-outcome/:actionType', recordAnOutcome(hmppsAuthClient))

  post('/case/:crn/record-an-outcome/:actionType', recordAnOutcomePost(hmppsAuthClient))
}
