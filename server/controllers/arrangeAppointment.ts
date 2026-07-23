import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { Controller, FileCache } from '../@types'
import {
  convertToTitleCase,
  dateIsInPast,
  dateWithYear,
  getDataValue,
  getPersonLevelTypes,
  isNumericString,
  isValidCrn,
  isValidUUID,
  setDataValue,
} from '../utils'
import { logSessionCacheChange } from '../utils/logSessionCacheChange'
import {
  renderError,
  getOfficeLocationsByTeamAndProvider,
  checkAnswers,
  getUserOptions,
  findUncompleted,
  appointmentDateIsInPast,
  isRescheduleAppointment,
} from '../middleware'
import { AppointmentSession } from '../models/Appointments'
import { SmsOptInOptions } from '../data/model/OutlookEvent'
import { AppResponse } from '../models/Locals'
import config from '../config'
import MasApiClient from '../data/masApiClient'
import '../@types/express/index.d'
import { getMinMaxDates } from '../utils/getMinMaxDates'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { User } from '../data/model/caseload'
import { filterContacts } from '../middleware/filterContacts'
import logger from '../../logger'

const routes = [
  'redirectToSentence',
  'getSentence',
  'postSentence',
  'getTypeAttendance',
  'postTypeAttendance',
  'getWhoWillAttend',
  'postWhoWillAttend',
  'getLocationDateTime',
  'postLocationDateTime',
  'getAttendedComplied',
  'postAttendedComplied',
  'getLocationNotInList',
  'getSupportingInformation',
  'postSupportingInformation',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getConfirmation',
  'postConfirmation',
  'getArrangeAnotherAppointment',
  'postArrangeAnotherAppointment',
  'getAddNote',
  'postAddNote',
  'getTextMessageConfirmation',
  'postTextMessageConfirmation',
] as const

const resetSessionValues = (req: Request, res: Response) => {
  const { crn, id } = req.params as Record<string, string>
  const { data } = req.session
  const path = ['appointments', crn, id]
  const context = { uuid: id, username: res.locals.user?.username, enabled: res.locals.flags.enableSessionCacheLogging }
  const originalDate = getDataValue(data, [...path, 'temp', 'date'])
  const updatedDate = getDataValue(data, [...path, 'date'])
  const smsOptIn = getDataValue<SmsOptInOptions>(data, [...path, 'smsOptIn'])
  const originalDateWasInPast = getDataValue(data, [...path, 'temp', 'isInPast'])
  const updatedDateIsInPast = appointmentDateIsInPast(req)
  const retainOutcomeRecorded = originalDateWasInPast && originalDate === updatedDate
  if (!retainOutcomeRecorded) {
    if (res.locals.flags.enableNonCompliance) {
      logSessionCacheChange('resetSessionValues', data, [...path, 'outcome', 'outcomeType'], null, context)
      setDataValue(data, [...path, 'outcome', 'outcomeType'], null)
    } else {
      logSessionCacheChange('resetSessionValues', data, [...path, 'outcomeRecorded'], null, context)
      setDataValue(data, [...path, 'outcomeRecorded'], null)
    }
  }
  if (updatedDateIsInPast && smsOptIn?.includes('YES')) {
    logSessionCacheChange('resetSessionValues', data, [...path, 'smsOptIn'], 'NO', context)
    setDataValue(data, [...path, 'smsOptIn'], 'NO')
    delete req.session.data.appointments[crn][id].smsPreview
  }
  const retainNotesAndSensitivity = (!originalDateWasInPast && !updatedDateIsInPast) || retainOutcomeRecorded
  if (!retainNotesAndSensitivity) {
    logSessionCacheChange('resetSessionValues', data, [...path, 'notes'], null, context)
    logSessionCacheChange('resetSessionValues', data, [...path, 'sensitivity'], null, context)
    setDataValue(data, [...path, 'notes'], null)
    setDataValue(data, [...path, 'sensitivity'], null)
  }
}

const arrangeAppointmentController: Controller<typeof routes, void | AppResponse> = {
  redirectToSentence: () => {
    return async function redirectToSentence(req, res) {
      const uuid = uuidv4()
      const { crn } = req.params as Record<string, string>
      const { back } = req.query
      if (!isValidCrn(crn) || !isValidUUID(uuid)) {
        return renderError(404)(req, res)
      }
      if (back) {
        return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/sentence?back=${back}`)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    }
  },
  getSentence: () => {
    return async function getSentence(req, res) {
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
      }
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const { data } = req.session
      let { back } = req.query
      const context = {
        uuid: id,
        username: res.locals.user?.username,
        enabled: res.locals.flags.enableSessionCacheLogging,
      }

      if (data?.sentences?.[crn] && data?.sentences?.[crn].length === 1) {
        logSessionCacheChange(
          'getSentence',
          data,
          ['appointments', crn, id, 'eventId'],
          data?.sentences?.[crn][0].id,
          context,
        )
        setDataValue(data, ['appointments', crn, id, 'eventId'], data?.sentences?.[crn][0].id)
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/type-attendance`)
      }
      await sendAuditMessage(res, 'SELECT_MAS_APPOINTMENT_FOR', crn, SubjectType.CRN)
      if (back) {
        logSessionCacheChange('getSentence', data, ['backLink', 'sentence'], back, context)
        setDataValue(data, ['backLink', 'sentence'], back)
      } else {
        back = getDataValue(data, ['backLink', 'sentence'])
      }

      return res.render(`pages/arrange-appointment/sentence`, { crn, id, change, errors, back })
    }
  },
  postSentence: () => {
    return async function postSentence(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const selectedRegion = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])
      const selectedTeam = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
      const teamQueryParam = selectedTeam ? `&teamCode=${selectedTeam}` : ''
      const queryParameters = selectedRegion ? `?providerCode=${selectedRegion}${teamQueryParam}` : ''
      let redirect = `/case/${crn}/arrange-appointment/${id}/type-attendance${queryParameters}`
      if (change) {
        redirect = findUncompleted()(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getTypeAttendance: () => {
    return async function getTypeAttendance(req, res) {
      const errors = req?.session?.data?.errors
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const { data } = req.session
      const url = encodeURIComponent(req.url)
      const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
      await sendAuditMessage(res, 'SELECT_MAS_APPOINTMENT_TYPE_AND_ATTENDANCE', crn, SubjectType.CRN)
      if (!eventId) {
        if (isValidCrn(crn) && isValidUUID(id)) {
          return res.redirect(`/case/${crn}/arrange-appointment/${id}/sentence`)
        }
        return renderError(404)(req, res)
      }
      const personLevel = eventId === 'PERSON_LEVEL_CONTACT'
      const { appointmentTypes } = res.locals
      if (personLevel) {
        res.locals.appointmentTypes = getPersonLevelTypes(appointmentTypes)
      }
      if (data?.sentences?.[crn] && data?.sentences?.[crn].length === 1) {
        return res.render(`pages/arrange-appointment/type-attendance`, {
          crn,
          id,
          url,
          change,
          errors,
          allSentences: req?.session?.data?.sentences?.[crn],
        })
      }
      return res.render(`pages/arrange-appointment/type-attendance`, { crn, id, url, change, errors })
    }
  },
  postTypeAttendance: () => {
    return async function postTypeAttendance(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { number } = req.query as Record<string, string>
      const query = number ? `?number=${number}` : ''
      if (!isValidCrn(crn) || !isValidUUID(id) || (number && !isNumericString(number))) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/location-date-time${query}`
      if (change) {
        redirect = findUncompleted()(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getWhoWillAttend: () => {
    return async function getWhoWillAttend(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const errors = req?.session?.data?.errors
      await sendAuditMessage(res, 'SELECT_MAS_APPOINTMENT_ATTENDANCE', crn, SubjectType.CRN)
      if (errors) {
        delete req.session.data.errors
      }
      return res.render(`pages/arrange-appointment/attendance`, { crn, id, errors, change })
    }
  },
  postWhoWillAttend: hmppsAuthClient => {
    return async function postWhoWillAttend(req, res) {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { body, query, session } = req
      const { change } = query as Record<string, string>
      const { data } = session
      const providerCode = body?.appointments?.[crn]?.[id]?.temp?.providerCode
      const teamCode = body?.appointments?.[crn]?.[id]?.temp?.teamCode
      const username = body?.appointments?.[crn]?.[id]?.temp?.username
      const staff = getDataValue<User[]>(data, ['staff', res.locals.user.username])
      const staffMember = staff?.find(person => person.username === username)
      logger.info(
        `[postWhoWillAttend] uuid='${id}' loggedInUser='${res.locals.user.username}' selectedUsername='${username}' staffMemberFound=${Boolean(staffMember)}`,
      )
      if (providerCode) {
        const postWhoWillAttendContext = { uuid: id, username, enabled: res.locals.flags.enableSessionCacheLogging }
        logSessionCacheChange(
          'postWhoWillAttend',
          data,
          ['appointments', crn, id, 'user', 'providerCode'],
          providerCode,
          postWhoWillAttendContext,
        )
        logSessionCacheChange(
          'postWhoWillAttend',
          data,
          ['appointments', crn, id, 'user', 'teamCode'],
          teamCode,
          postWhoWillAttendContext,
        )
        logSessionCacheChange(
          'postWhoWillAttend',
          data,
          ['appointments', crn, id, 'user', 'username'],
          username,
          postWhoWillAttendContext,
        )
        setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
        setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
        setDataValue(data, ['appointments', crn, id, 'user', 'username'], username)
        if (res.locals.flags.enableMAN2344) {
          const email = staffMember?.email ?? null
          const name = staffMember?.name ?? null
          logSessionCacheChange(
            'postWhoWillAttend',
            data,
            ['appointments', crn, id, 'user', 'email'],
            email,
            postWhoWillAttendContext,
          )
          logSessionCacheChange(
            'postWhoWillAttend',
            data,
            ['appointments', crn, id, 'user', 'name'],
            name,
            postWhoWillAttendContext,
          )
          setDataValue(data, ['appointments', crn, id, 'user', 'email'], email)
          setDataValue(data, ['appointments', crn, id, 'user', 'name'], name)
        }
        await getOfficeLocationsByTeamAndProvider(hmppsAuthClient)(req, res)
        await getUserOptions(hmppsAuthClient)(req, res)
        checkAnswers(req, res)
      }
      if (req.session?.data?.appointments?.[crn]?.[id]?.temp) {
        delete req.session.data.appointments[crn][id].temp
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/type-attendance`
      if (change) {
        redirect = findUncompleted()(req, res)
      }
      return res.redirect(redirect)
    }
  },

  getLocationDateTime: _hmppsAuthClient => {
    return async function getLocationDateTime(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { data, alertDismissed = false } = req.session
      const { change, validation } = req.query as Record<string, string>
      const isInPast = appointmentDateIsInPast(req)
      await sendAuditMessage(res, 'ADD_MAS_APPOINTMENT_DATE_TIME_LOCATION', crn, SubjectType.CRN)
      const isReschedule = isRescheduleAppointment(req)
      if (change) {
        const date = getDataValue(data, ['appointments', crn, id, 'date'])
        const glDtContext = {
          uuid: id,
          username: res.locals.user?.username,
          enabled: res.locals.flags.enableSessionCacheLogging,
        }
        logSessionCacheChange('getLocationDateTime', data, ['appointments', crn, id, 'temp', 'date'], date, glDtContext)
        logSessionCacheChange(
          'getLocationDateTime',
          data,
          ['appointments', crn, id, 'temp', 'isInPast'],
          isInPast,
          glDtContext,
        )
        setDataValue(data, ['appointments', crn, id, 'temp', 'date'], date)
        setDataValue(data, ['appointments', crn, id, 'temp', 'isInPast'], isInPast)
      }
      const errors = data?.errors
      const { appointment } = res.locals
      const locations = res?.locals?.userLocations || []
      if (errors) {
        delete req.session.data.errors
      }
      if (!locations?.length && appointment.type?.isLocationRequired) {
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/location-not-in-list?noLocations=true`)
      }
      const { _maxDate } = getMinMaxDates()
      res.locals.change = change as any

      return res.render(`pages/arrange-appointment/location-date-time`, {
        crn,
        id,
        _maxDate,
        errors,
        change,
        isInPast,
        alertDismissed,
        isReschedule,
      })
    }
  },
  postLocationDateTime: () => {
    return async function postLocationDateTime(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const path = ['appointments', crn, id]
      if (change) {
        resetSessionValues(req, res)
      }
      const selectedLocation = getDataValue(data, [...path, 'user', 'locationCode'])
      let nextPage = res.locals?.flags?.enableSmsReminders ? `text-message-confirmation` : `supporting-information`

      if (res.locals.flags.enableNonCompliance && appointmentDateIsInPast(req)) {
        nextPage = 'outcome'
      }
      if (!res.locals.flags.enableNonCompliance && appointmentDateIsInPast(req)) {
        nextPage = `attended-complied`
      }
      if (selectedLocation === `LOCATION_NOT_IN_LIST`) {
        nextPage = `location-not-in-list`
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/${nextPage}`
      if (change && nextPage !== 'location-not-in-list') {
        redirect = findUncompleted()(req, res)
      }
      if (change && nextPage === 'location-not-in-list') {
        redirect = `${redirect}?change=${change}`
      }
      return res.redirect(redirect)
    }
  },
  getAttendedComplied: _hmppsAuthClient => {
    return async function getAttendedComplied(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { alertDismissed = false } = req.session
      const { forename, surname, appointment } = res.locals.appointmentOutcome
      const isReschedule = isRescheduleAppointment(req)
      await sendAuditMessage(res, 'SELECT_MAS_APPOINTMENT_ATTENDED_AND_COMPLIED', crn, SubjectType.CRN)
      res.render('pages/appointments/attended-complied', {
        crn,
        id,
        alertDismissed,
        isInPast: true,
        appointment,
        cancelLink: `/case/${crn}/arrange-appointment/${id}/location-date-time`,
        forename: convertToTitleCase(forename),
        surname: convertToTitleCase(surname),
        useDecorator: true,
        isReschedule,
      })
    }
  },
  postAttendedComplied: () => {
    return async function postAttendedComplied(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/add-note${change ? `?change=${change}` : ''}`)
    }
  },
  getLocationNotInList: () => {
    return async function getLocationNotInList(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change = undefined, noLocations = '' } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_APPOINTMENT_UNLISTED_LOCATION', crn, SubjectType.CRN)
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id, noLocations, change })
    }
  },
  getAddNote: () => {
    return async function getAddNote(req, res) {
      const { crn, id } = req.params as Record<string, string>
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
      await sendAuditMessage(res, 'ADD_MAS_APPOINTMENT_NOTE', crn, SubjectType.CRN)
      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config
      const { forename, appointment } = res.locals.appointmentOutcome

      const { data } = req.session
      const isSensitive = getDataValue(data, ['appointments', crn, id, 'sensitivityLocked'])
      return res.render('pages/appointments/add-note', {
        crn,
        id,
        useDecorator: true,
        errorMessages,
        body,
        validMimeTypes: Object.entries(validMimeTypes).map(([_key, value]) => value),
        maxFileSize,
        fileUploadLimit,
        uploadedFiles,
        maxCharCount,
        forename,
        appointment,
        isSensitive,
      })
    }
  },
  postAddNote: _hmppsAuthClient => {
    return async function postAddNote(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(change ?? `/case/${crn}/arrange-appointment/${id}/check-your-answers`)
    }
  },
  getTextMessageConfirmation: _hmppsAuthClient => {
    return async function getTextMessageConfirmation(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_APPOINTMENT_CONFIRM_TEXT_MSG', crn, SubjectType.CRN)
      if (res.locals.flags.enableSmsReminders) {
        return res.render('pages/arrange-appointment/text-message-confirmation', { crn, id, change })
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/location-date-time`)
    }
  },
  postTextMessageConfirmation: _hmppsAuthClient => {
    return async function postTextMessageConfirmation(req, res) {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const url = encodeURIComponent(req.url)
      let redirect = `/case/${crn}/arrange-appointment/${id}/supporting-information?back=${url}`
      const change = req?.query?.change as string
      const isEditingMobileNumber = ['YES_ADD_MOBILE_NUMBER', 'YES_UPDATE_MOBILE_NUMBER'].includes(
        req.body.appointments[crn][id].smsOptIn,
      )
      if (change) {
        redirect = findUncompleted()(req, res)
      }
      if (isEditingMobileNumber) {
        redirect = `/case/${crn}/personal-details/${id}/edit-contact-details?origin=appointments&back=${url}${change ? `&change=${change}` : ''}`
      }
      return res.redirect(redirect)
    }
  },
  getSupportingInformation: () => {
    return async function getSupportingInformation(req, res) {
      const { maxCharCount } = config
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      await sendAuditMessage(res, 'ADD_MAS_APPOINTMENT_SUPPORTING_INFO', crn, SubjectType.CRN)
      const isInPast = appointmentDateIsInPast(req)
      const back = 'date-time'

      const { data } = req.session
      const isSensitive = getDataValue(data, ['appointments', crn, id, 'sensitivityLocked'])

      return res.render(`pages/arrange-appointment/supporting-information`, {
        crn,
        id,
        back,
        change,
        maxCharCount,
        isInPast,
        isSensitive,
      })
    }
  },
  postSupportingInformation: () => {
    return async function postSupportingInformation(req, res) {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
      if (change) {
        redirect = findUncompleted()(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getCheckYourAnswers: () => {
    return async function getCheckYourAnswers(req, res) {
      const url = encodeURIComponent(req.url)
      const { crn, id: uuid } = req.params as Record<string, string>
      let { contactId } = req.params as Record<string, string>
      const id = uuid ?? contactId
      const { data } = req.session
      let location = null
      const { isReschedule } = res.locals.appointment
      const sensitivityLocked = getDataValue(data, ['appointments', crn, id, 'sensitivityLocked'])
      if (isReschedule) {
        contactId = getDataValue(data, ['appointments', crn, uuid, 'rescheduleAppointment', 'contactId'])
      }
      await sendAuditMessage(
        res,
        !isReschedule
          ? 'VIEW_MAS_APPOINTMENT_CHECK_YOUR_ANSWERS'
          : 'VIEW_MAS_CHANGE_APPOINTMENT_DETAILS_AND_RESCHEDULE',
        crn,
        SubjectType.CRN,
      )
      const {
        start,
        date,
        user: { locationCode: selectedLocation },
      } = getDataValue(data, ['appointments', crn, id])
      const { isInPast } = dateIsInPast(date, start)
      if (![`LOCATION_NOT_IN_LIST`, 'NO_LOCATION_REQUIRED'].includes(selectedLocation)) {
        location = res.locals.userLocations.find((loc: any) => loc.description === selectedLocation)
      }
      return res.render(`pages/arrange-appointment/check-your-answers`, {
        crn,
        id,
        contactId,
        location,
        url,
        isInPast,
        sensitivityLocked,
      })
    }
  },

  postCheckYourAnswers: () => {
    return async function postCheckYourAnswers(req, res) {
      const { crn, id } = req.params as Record<string, string>
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    }
  },
  getConfirmation: hmppsAuthClient => {
    return async function getConfirmation(req, res) {
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      const url = encodeURIComponent(req.url)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const {
        user: attending,
        smsOptIn,
        rescheduleAppointment,
      } = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
      const linkedContactId = getDataValue<string>(data, ['temp', crn, 'linkedContactId']) || null
      const smsSent = smsOptIn?.includes('YES') || null
      await sendAuditMessage(res, 'VIEW_MAS_APPOINTMENT_CONFIRMATION', crn, SubjectType.CRN)
      let attendingName = 'your'
      if (attending.username.toUpperCase() !== res.locals.user.username.toUpperCase()) {
        if (attending?.name?.forename) {
          const formattedName =
            attending.name.forename.charAt(0).toUpperCase() + attending.name.forename.slice(1).toLowerCase()
          // First letter of the PPs name should be uppercase as per requirement
          attendingName = `${formattedName}’s`
        } else {
          const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
          const masClient = new MasApiClient(token)
          try {
            const probationPractitioner = await masClient.getProbationPractitioner(crn)
            const probationPractitionersForename = probationPractitioner.name.forename || ''
            const formattedName =
              probationPractitionersForename.charAt(0).toUpperCase() +
              probationPractitionersForename.slice(1).toLowerCase()
            // First letter of the PPs name should be uppercase as per requirement
            attendingName = `${formattedName}’s`
          } catch {
            attendingName = `The officer’s`
          }
        }
      }
      const responseContactId = getDataValue(data, ['temp', crn, 'responseContactId']) || null

      if (responseContactId) {
        logSessionCacheChange('getConfirmation', data, ['temp', crn, 'responseContactId'], null, {
          uuid: id,
          username: res.locals.user?.username,
          enabled: res.locals.flags.enableSessionCacheLogging,
        })
        setDataValue(data, ['temp', crn, 'responseContactId'], null)
      }
      const { isOutLookEventFailed = null, isEnglishNotificationFailed = null, isWelshNotificationFailed = null } = data
      const isInPast = appointmentDateIsInPast(req)
      delete req.session.data.isOutLookEventFailed
      delete req.session.data.isEnglishNotificationFailed
      delete req.session.data.isWelshNotificationFailed
      let appointmentType = null
      if (rescheduleAppointment?.contactId) {
        appointmentType = 'RESCHEDULE'
      }
      if (res.locals.contactResponse) {
        let outcomes = res.locals.contactResponse.content
        if (res.locals.flags?.enableOutcomesV1) {
          outcomes = filterContacts(outcomes)
        }
        res.locals.contactResponse.content = outcomes
      }
      let linkedAppointment = null
      if (res?.locals?.flags?.enableNonCompliance && linkedContactId) {
        const { start, type: typeCode } = getDataValue<AppointmentSession>(data, ['appointments', crn, linkedContactId])
        linkedAppointment = {
          contactId: linkedContactId,
          date: dateWithYear(start),
          type: res.locals.appointmentTypes.find((type: any) => type.code === typeCode)?.description || null,
        }
      }

      // tidy up current appointment session 👇
      if (req.session.data.appointments?.[crn]?.[id]) {
        delete req.session.data.appointments[crn][id]
      }

      return res.render(`pages/arrange-appointment/confirmation`, {
        crn,
        responseContactId,
        isOutLookEventFailed,
        attendingName,
        linkedAppointment,
        url,
        isInPast,
        appointmentType,
        smsSent,
        isEnglishNotificationFailed,
        isWelshNotificationFailed,
      })
    }
  },
  postConfirmation: () => {
    return async function postConfirmation(req, res) {
      const url = encodeURIComponent(req.url)
      const { crn, id } = req.params as Record<string, string>
      const { _linkedContactId } = req.body
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      if (res?.locals?.flags?.enableNonCompliance && _linkedContactId) {
        return res.redirect(
          `/case/${crn}/appointments/appointment/${_linkedContactId}/outcome/check-your-answers?back=${url}`,
        )
      }
      return res.redirect(`/case/${crn}?back=${url}`)
    }
  },
  getArrangeAnotherAppointment: () => {
    return async function getArrangeAnotherAppointment(req, res) {
      const url = encodeURIComponent(req.url)
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
      await sendAuditMessage(res, 'VIEW_MAS_ARRANGE_NEXT_APPOINTMENT', crn, SubjectType.CRN)
      if (!appointment) {
        return res.redirect(`/case/${crn}/appointments`)
      }
      const { date, start } = appointment
      let isInPast = null
      if (date) {
        ;({ isInPast } = dateIsInPast(date, start))
      }
      return res.render(`pages/arrange-appointment/arrange-another-appointment`, { url, crn, id, isInPast })
    }
  },
  postArrangeAnotherAppointment: () => {
    return async function postArrangeAnotherAppointment(req, res) {
      const { crn, id } = req.params as Record<string, string>
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    }
  },
}

export default arrangeAppointmentController
