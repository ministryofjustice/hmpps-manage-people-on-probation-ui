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
import { toPredictors, toRoshWidget } from '../utils'
import ArnsApiClient from '../data/arnsApiClient'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', async (req, res, _next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const arnsClient = new ArnsApiClient(token)
    const masClient = new MasApiClient(token)
    const tierClient = new TierApiClient(token)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_APPOINTMENTS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const [upcomingAppointments, pastAppointments, risks, tierCalculation, predictors] = await Promise.all([
      masClient.getPersonSchedule(crn, 'upcoming'),
      masClient.getPersonSchedule(crn, 'previous'),
      arnsClient.getRisks(crn),
      tierClient.getCalculationDetails(crn),
      arnsClient.getPredictorsAll(crn),
    ])

    const risksWidget = toRoshWidget(risks)

    const predictorScores = toPredictors(predictors)
    res.render('pages/appointments', {
      upcomingAppointments,
      pastAppointments,
      crn,
      tierCalculation,
      risksWidget,
      predictorScores,
    })
  })

  post('/case/:crn/appointments', async (req, res, next) => {
    const { crn } = req.params
    res.redirect(`/case/${crn}/arrange-appointment/type`)
  })

  get('/case/:crn/appointments/appointment/:contactId', async (req, res, _next) => {
    const { crn } = req.params
    const { contactId } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_PERSONAL_DETAILS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const personAppointment = await masClient.getPersonAppointment(crn, contactId)
    res.render('pages/appointments/appointment', {
      personAppointment,
      crn,
    })
  })

  get('/case/:crn/record-an-outcome/:actionType', async (req, res, _next) => {
    const { crn, actionType } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_PERSONAL_DETAILS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const schedule = await masClient.getPersonSchedule(crn, 'previous')
    res.render('pages/appointments/record-an-outcome', {
      schedule,
      crn,
      actionType,
    })
  })

  post('/case/:crn/record-an-outcome/:actionType', async (req, res, _next) => {
    const { crn, actionType } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    const errorMessages: ErrorMessages = {}
    if (req.body['appointment-id'] == null) {
      logger.info('Appointment not selected')
      errorMessages.appointment = { text: 'Please select an appointment' }
      const schedule = await masClient.getPersonSchedule(crn, 'previous')
      res.render('pages/appointments/record-an-outcome', {
        errorMessages,
        schedule,
        crn,
        actionType,
      })
    } else {
      res.redirect(`/case/${crn}/appointments/appointment/${req.body['appointment-id']}`)
    }
  })
}
