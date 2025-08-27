import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors, isNumericString, isValidCrn, isMatchingAddress } from '../utils'
import { renderError } from '../middleware'
import { AppointmentPatch } from '../models/Appointments'

const routes = [
  'getAppointments',
  'getAllUpcomingAppointments',
  'postAppointments',
  'getAppointmentDetails',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
  'getManageAppointment',
] as const

const appointmentsController: Controller<typeof routes, void> = {
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
          masClient.getPersonSchedule(crn, 'upcoming', '0'),
          masClient.getPersonSchedule(crn, 'previous', '0'),
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
  getAllUpcomingAppointments: hmppsAuthClient => {
    return async (req, res) => {
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date.asc'
      const [sortName, sortDirection] = sortedBy.split('.')
      const isAscending: boolean = sortDirection === 'asc'
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const sortQuery =
        sortName === 'time' ? `&sortBy=date&ascending=${isAscending}` : `&sortBy=${sortName}&ascending=${isAscending}`
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ALL_UPCOMING_APPOINTMENTS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const [upcomingAppointments, risks, tierCalculation, predictors] = await Promise.all([
        masClient.getPersonSchedule(crn, 'upcoming', (pageNum - 1).toString(), sortQuery),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        upcomingAppointments.personSchedule?.totalPages || 0,
        upcomingAppointments.personSchedule?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        upcomingAppointments.personSchedule?.size || 10,
      )

      return res.render('pages/upcoming-appointments', {
        upcomingAppointments,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        sortedBy,
        pagination,
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
      await auditService.sendAuditMessage({
        action: 'VIEW_MANAGE_APPOINTMENT',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { username } = res.locals.user
      const [personAppointment, nextComAppointment, appointmentTypes] = await Promise.all([
        masClient.getPersonAppointment(crn, contactId),
        masClient.getNextComAppointment(username, crn, contactId),
        masClient.getAppointmentTypes(),
      ])
      const { appointment } = personAppointment
      const deliusManaged =
        (appointment?.hasOutcome && appointment?.acceptableAbsence === false) ||
        appointmentTypes.appointmentTypes.every(type => type.description !== appointment.type)
      const nextAppointmentIsAtHome = isMatchingAddress(
        res.locals.case.mainAddress,
        nextComAppointment?.appointment?.location,
      )
      return res.render('pages/appointments/manage-appointment', {
        personAppointment,
        crn,
        nextComAppointment,
        deliusManaged,
        nextAppointmentIsAtHome,
      })
    }
  },
  getRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      await auditService.sendAuditMessage({
        action: 'UPDATE_APPOINTMENT_OUTCOME',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      return res.render('pages/appointments/record-an-outcome', {
        crn,
        contactId,
      })
    }
  },
  postRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      if (!isValidCrn(crn) || !isNumericString(contactId)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const body: AppointmentPatch = {
        id: parseInt(contactId, 10),
        outcomeRecorded: true,
      }
      await masClient.patchAppointment(body)
      return res.redirect(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    }
  },
}

export default appointmentsController
