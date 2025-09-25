import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller, FileCache } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors, isNumericString, isValidCrn, isMatchingAddress, handleQuotes } from '../utils'
import { renderError, cloneAppointmentAndRedirect } from '../middleware'
import { AppointmentPatch } from '../models/Appointments'
import config from '../config'
import { getQueryString } from './activityLog'
import arrangeAppointmentController from './arrangeAppointment'

const routes = [
  'getAppointments',
  'getAllUpcomingAppointments',
  'postAppointments',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
  'getAddNote',
  'postAddNote',
  'getManageAppointment',
  'getNextAppointment',
  'postNextAppointment',
  'getAppointmentNote',
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
      const { url } = req
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
        url,
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
      return res.redirect(`/case/${crn}/arrange-appointment/sentence`)
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
      const { back } = req.query
      let { url } = req
      url = encodeURIComponent(url)
      const queryParams = getQueryString(req.query as Record<string, string>)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { username } = res.locals.user
      const [personAppointment, nextAppointment] = await Promise.all([
        masClient.getPersonAppointment(crn, contactId),
        masClient.getNextAppointment(username, crn, contactId),
      ])
      const nextAppointmentIsAtHome = isMatchingAddress(
        res.locals.case.mainAddress,
        nextAppointment?.appointment?.location,
      )
      return res.render('pages/appointments/manage-appointment', {
        personAppointment,
        crn,
        back,
        queryParams,
        url,
        nextAppointment,
        nextAppointmentIsAtHome,
      })
    }
  },
  getRecordAnOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      await auditService.sendAuditMessage({
        action: 'VIEW_RECORD_AN_OUTCOME',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      res.render('pages/appointments/record-an-outcome', {
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
      const { back } = req.query as Record<string, string>
      await masClient.patchAppointment(body)
      return res.redirect(back ?? `/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },
  getAddNote: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      await auditService.sendAuditMessage({
        action: 'ADD_APPOINTMENT_NOTES',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      let uploadedFiles: FileCache[] = []
      let errorMessages = null
      let body = null
      if (req?.session?.cache?.uploadedFiles) {
        uploadedFiles = req.session.cache.uploadedFiles
        delete req.session.cache.uploadedFiles
      }
      if (req?.session?.errorMessages) {
        errorMessages = req.session.errorMessages
        delete req.session.errorMessages
      }
      if (req?.session?.body) {
        body = req.session.body
        delete req.session.body
      }
      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config
      return res.render('pages/appointments/add-note', {
        crn,
        errorMessages,
        body,
        validMimeTypes: Object.entries(validMimeTypes).map(([_key, value]) => value),
        maxFileSize,
        fileUploadLimit,
        uploadedFiles,
        maxCharCount,
      })
    }
  },
  postAddNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId: id } = req.params

      if (!isValidCrn(crn) || !isNumericString(id)) {
        return renderError(404)(req, res)
      }
      const { notes, sensitive } = req.body
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const body: AppointmentPatch = {
        id: parseInt(id, 10),
        notes: handleQuotes(notes),
        sensitive: sensitive === 'Yes',
      }
      await masClient.patchAppointment(body)
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },

  getNextAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { nextAppointment } = res.locals
      const { crn, contactId } = req.params
      if (nextAppointment?.appointment) {
        return res.redirect(`/case/${crn}/appointments/appointment/${contactId}/manage`)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_NEXT_APPOINTMENT',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personAppointment = await masClient.getPersonAppointment(crn, contactId)
      return res.render('pages/appointments/next-appointment', {
        personAppointment,
        crn,
        contactId,
      })
    }
  },

  postNextAppointment: _hmppsAuthClient => {
    return async (req, res) => {
      const {
        params: { crn, contactId },
        body,
      } = req
      if (!isValidCrn(crn) || !isNumericString(contactId)) {
        return renderError(404)(req, res)
      }
      const nextAppointment = body.nextAppointment as 'CHANGE_TYPE' | 'KEEP_TYPE' | 'NO'
      const { nextAppointmentSession } = res.locals
      if (nextAppointment === 'CHANGE_TYPE') {
        return arrangeAppointmentController.redirectToSentence()(req, res)
      }
      if (nextAppointment === 'KEEP_TYPE') {
        return cloneAppointmentAndRedirect(nextAppointmentSession)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/appointment/${contactId}/manage/`)
    }
  },
  getAppointmentNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personAppointment = await masClient.getPersonAppointmentNote(crn, contactId, noteId)
      const isActivityLog = true
      const queryParams = getQueryString(req.query as Record<string, string>)
      const { back } = req.query
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      res.render('pages/appointments/appointment', {
        queryParams,
        back,
        personAppointment,
        crn,
        contactId,
        isActivityLog,
      })
    }
  },
}

export default appointmentsController
