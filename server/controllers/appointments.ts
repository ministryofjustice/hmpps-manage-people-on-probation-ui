import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Request } from 'express'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors, isNumericString, isValidCrn } from '../utils'
import logger from '../../logger'
import { ErrorMessages } from '../data/model/caseload'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentPatch } from '../models/Appointments'

const routes = [
  'getAppointments',
  'postAppointments',
  'getAppointmentDetails',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
  'getManageAppointment',
] as const

const appointmentsController: Controller<typeof routes> = {
  getAppointments: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
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

      const [upcomingAppointments, pastAppointments, risks, tierCalculation, predictors, personRisks] =
        await Promise.all([
          masClient.getPersonSchedule(crn, 'upcoming'),
          masClient.getPersonSchedule(crn, 'previous'),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          arnsClient.getPredictorsAll(crn),
          masClient.getPersonRiskFlags(crn),
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
        personRisks,
      })
    }
  },
  postAppointments: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
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
  getManageAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const [personAppointment, upcomingAppointments] = await Promise.all([
        masClient.getPersonAppointment(crn, contactId),
        masClient.getPersonSchedule(crn, 'upcoming'),
      ])
      // console.dir(upcomingAppointments, { depth: null })
      const { appointment } = personAppointment
      console.dir(appointment, { depth: null })
      const apptDate = DateTime.fromISO(appointment.startDateTime)
      const isInPast = apptDate.diffNow().milliseconds < 0
      const canLogOutcome = isInPast && appointment?.didTheyComply === false
      const nextAppointment = upcomingAppointments.appointments.find(appt => appt.id !== contactId)
      return res.render('pages/appointments/manage-appointment', {
        personAppointment,
        crn,
        canLogOutcome,
        nextAppointment,
      })
    }
  },
  getRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_DETAILS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      return res.render('pages/appointments/record-an-outcome', {
        crn,
      })
    }
  },
  postRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId: id } = req.params
      if (!isValidCrn(crn) || !isNumericString(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const body: AppointmentPatch = {
        id: parseInt(id, 10),
        outcomeRecorded: true,
      }
      await masClient.patchAppointment(body)
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },
}

export default appointmentsController
