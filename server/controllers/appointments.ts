import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Request } from 'express'
import { AppResponse, Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils'
import logger from '../../logger'
import { ErrorMessages } from '../data/model/caseload'

const routes = [
  'getAppointments',
  'postAppointments',
  'getAppointmentDetails',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
] as const

const appointmentsController: Controller<typeof routes> = {
  getAppointments: hmppsAuthClient => {
    return async (req, res) => {
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
      return res.render('pages/appointments', {
        upcomingAppointments,
        pastAppointments,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
      })
    }
  },
  postAppointments: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      return res.redirect(`/case/${crn}/arrange-appointment/type`)
    }
  },
  getAppointmentDetails: hmppsAuthClient => {
    return async (req, res) => {
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
    }
  },
  getRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
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
    }
  },
  postRecordAnOutcome: hmppsAuthClient => {
    return async (req: Request, res: AppResponse) => {
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
    }
  },
}

export default appointmentsController
