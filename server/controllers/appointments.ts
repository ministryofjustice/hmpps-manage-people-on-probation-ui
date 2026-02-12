import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller, FileCache } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import {
  toRoshWidget,
  toPredictors,
  isNumericString,
  isValidCrn,
  isMatchingAddress,
  handleQuotes,
  setDataValue,
  getDataValue,
  canRescheduleAppointment,
} from '../utils'
import { renderError, cloneAppointmentAndRedirect, getAttendedCompliedProps } from '../middleware'
import { AppointmentPatch } from '../models/Appointments'
import config from '../config'
import { getCheckinOffenderDetails } from '../middleware/getCheckinOffenderDetails'

const routes = [
  'getAppointments',
  'getAllUpcomingAppointments',
  'postAppointments',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
  'getAttendedComplied',
  'postAttendedComplied',
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
      const url = encodeURIComponent(req.url)
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

      const [upcomingAppointments, pastAppointments, risks, tierCalculation, predictors, practitioner] =
        await Promise.all([
          masClient.getPersonSchedule(crn, 'upcoming', '0'),
          masClient.getPersonSchedule(crn, 'previous', '0'),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          arnsClient.getPredictorsAll(crn),
          masClient.getProbationPractitioner(crn),
        ])

      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      const hasDeceased = req.session.data.personalDetails?.[crn]?.overview?.dateOfDeath !== undefined
      const hasPractitioner = practitioner ? !practitioner.unallocated : false
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      return res.render('pages/appointments', {
        upcomingAppointments,
        pastAppointments,
        crn,
        url,
        tierCalculation,
        risksWidget,
        predictorScores,
        hasDeceased,
        hasPractitioner,
      })
    }
  },
  getAllUpcomingAppointments: hmppsAuthClient => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
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
      const url = encodeURIComponent(req.url)
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/sentence?back=${url}`)
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
      const { data } = req.session
      let { back } = req.query
      if (back) {
        setDataValue(data, ['backLink', 'manage'], back)
      } else {
        back = getDataValue(data, ['backLink', 'manage'])
      }
      const url = encodeURIComponent(req.url)
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
      const hasDeceased = req.session.data.personalDetails?.[crn]?.overview?.dateOfDeath !== undefined
      return res.render('pages/appointments/manage-appointment', {
        personAppointment,
        crn,
        back,
        url,
        nextAppointment,
        nextAppointmentIsAtHome,
        canReschedule: canRescheduleAppointment(personAppointment),
        contactId,
        hasDeceased,
      })
    }
  },
  getRecordAnOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const actionType = 'outcome'
      const { contactId } = req.query
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
        actionType,
        contactId,
      })
    }
  },

  postRecordAnOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, actionType } = req.params
      const appointmentId = req?.body?.['appointment-id'] as string
      if (!isValidCrn(crn) || !isNumericString(appointmentId)) {
        return renderError(404)(req, res)
      }
      return res.redirect(
        `/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/record-an-outcome/${actionType}?contactId=${appointmentId}`,
      )
    }
  },
  getAttendedComplied: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { alertDismissed = false } = req.session
      await auditService.sendAuditMessage({
        action: 'VIEW_RECORD_AN_OUTCOME',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const { forename, surname, appointment } = getAttendedCompliedProps(req, res)
      const headerPersonName = { forename, surname }
      res.render('pages/appointments/attended-complied', {
        crn,
        alertDismissed,
        isInPast: true,
        headerPersonName,
        forename,
        surname,
        appointment,
      })
    }
  },
  postAttendedComplied: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId: id } = req.params
      if (!isValidCrn(crn) || !isNumericString(id)) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      setDataValue(data, ['appointments', crn, id, 'outcomeRecorded'], true)
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/add-note`)
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
      const url = encodeURIComponent(req.url)
      const { maxCharCount } = config
      return res.render('pages/appointments/add-note', {
        crn,
        errorMessages,
        body,
        url,
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
      const outcomeRecorded = res?.locals?.personAppointment?.appointment?.hasOutcome === true
      const file = req.file as Express.Multer.File
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      const body: AppointmentPatch = {
        id: parseInt(id, 10),
        notes: handleQuotes(notes),
        sensitive: sensitive === 'Yes',
        outcomeRecorded,
      }

      if (req?.session?.data?.appointments?.[crn]?.[id]?.outcomeRecorded) {
        body.outcomeRecorded = true
        delete req.session.data.appointments[crn][id].outcomeRecorded
      }

      await masClient.patchAppointment(body)

      if (file) {
        const patchResponse = await masClient.patchDocuments(crn, id, file)

        if (!isSuccessfulUpload(patchResponse)) {
          return res.render('pages/appointments/add-note', {
            uploadError: 'File not uploaded. Please try again.',
            patchResponse,
            sensitive,
            notes,
          })
        }
      }

      return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },

  getNextAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      const { data } = req.session
      let { back } = req.query
      if (back) {
        setDataValue(data, ['backLink', 'next'], back)
      } else {
        back = getDataValue(data, ['backLink', 'next'])
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
        back,
        contactId,
      })
    }
  },

  postNextAppointment: _hmppsAuthClient => {
    return async (req, res) => {
      const {
        params: { crn, contactId },
        body,
        url,
      } = req
      if (!isValidCrn(crn) || !isNumericString(contactId)) {
        return renderError(404)(req, res)
      }
      const nextAppointment = body.nextAppointment as 'CHANGE_TYPE' | 'KEEP_TYPE' | 'NO'
      const { nextAppointmentSession } = res.locals
      if (nextAppointment === 'CHANGE_TYPE') {
        const uuid = v4()
        return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/sentence?back=${url}`)
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
      const { back } = req.query
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_APPOINTMENT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      res.render('pages/appointments/appointment', {
        back,
        personAppointment,
        crn,
        contactId,
      })
    }
  },
}

export const isSuccessfulUpload = (response: unknown): boolean => {
  // Null / undefined = success (MAS / stub behaviour)
  if (response == null) {
    return true
  }

  // Non-object (string, boolean, number) = success (legacy stubs)
  if (typeof response !== 'object') {
    return true
  }

  // At this point, response is an object
  const res = response as Record<string, unknown>

  // statusCode is authoritative
  if (typeof res.statusCode === 'number') {
    return res.statusCode >= 200 && res.statusCode < 300
  }

  // Explicit error shape
  if (Array.isArray(res.errors)) {
    return false
  }

  // Empty object = success
  if (Object.keys(res).length === 0) {
    return true
  }

  return false
}

export default appointmentsController
