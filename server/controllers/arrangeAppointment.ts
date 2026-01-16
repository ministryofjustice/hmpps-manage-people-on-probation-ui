import { v4 as uuidv4 } from 'uuid'
import { Request as ExpressRequest } from 'express'
import { Controller, FileCache } from '../@types'
import {
  convertToTitleCase,
  dateIsInPast,
  getDataValue,
  getPersonLevelTypes,
  isNumericString,
  isValidCrn,
  isValidUUID,
  setDataValue,
} from '../utils'
import {
  renderError,
  postAppointments,
  getOfficeLocationsByTeamAndProvider,
  checkAnswers,
  getUserOptions,
  findUncompleted,
  appointmentDateIsInPast,
  getAttendedCompliedProps,
  isRescheduleAppointment,
} from '../middleware'
import { AppointmentSession, AppointmentsPostResponse, RescheduleAppointmentResponse } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import config from '../config'
import MasApiClient from '../data/masApiClient'
import { postRescheduleAppointments } from '../middleware/postRescheduleAppointments'
import '../@types/express/index.d'
import { getMinMaxDates } from '../utils/getMinMaxDates'
import { PersonAppointment } from '../data/model/schedule'

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

export const appointmentSummary = async (req: ExpressRequest, res: AppResponse, client: HmppsAuthClient) => {
  const { data } = req.session
  const { crn, id, contactId } = req.params as Record<string, string>
  if (!isValidCrn(crn) || !isValidUUID(id)) {
    return renderError(404)(req, res)
  }
  const {
    user: { providerCode, teamCode, username, locationCode },
    eventId,
    type,
    date,
    sensitivity,
  } = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
  const mapping = {
    eventId: 'sentence',
    type: 'type-attendance',
    providerCode: 'attendance',
    teamCode: 'attendance',
    username: 'attendance',
    locationCode: 'location-date-time',
    date: 'location-date-time',
    sensitivity: 'supporting-information',
  }
  const requiredValues = { providerCode, teamCode, username, locationCode, eventId, type, date, sensitivity }
  let baseUrl = `/case/${crn}/arrange-appointment/${id}`
  let backendId
  for (const [k, v] of Object.entries(mapping)) {
    const value = requiredValues[k as keyof typeof requiredValues]
    if (!value) {
      return res.redirect(`${baseUrl}/${v}?validation=true&change=${req.url}`)
    }
  }
  if (req.url.includes('reschedule')) {
    baseUrl = `/case/${crn}/appointments/reschedule/${contactId}/${id}`
    const response: RescheduleAppointmentResponse | PersonAppointment = await postRescheduleAppointments(client)(
      req,
      res,
    )
    backendId = 'id' in response ? response.id : contactId
  } else {
    const response: AppointmentsPostResponse = await postAppointments(client)(req, res)
    backendId = response.appointments[response.appointments.length - 1].id
  }
  // setting backendId (part of AppointmentSession ) to create 'anotherAppointment' link in confirmation.njk
  setDataValue(data, ['appointments', crn, id, 'backendId'], backendId)

  return res.redirect(`${baseUrl}/confirmation`)
}

const arrangeAppointmentController: Controller<typeof routes, void | AppResponse> = {
  redirectToSentence: () => {
    return async (req, res) => {
      const uuid = uuidv4()
      const { crn } = req.params
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
    return async (req, res) => {
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
      }
      const { crn, id } = req.params as Record<string, string>
      const { change, validation } = req.query
      const { data } = req.session
      let { back } = req.query
      if (back) {
        setDataValue(data, ['backLink', 'sentence'], back)
      } else {
        back = getDataValue(data, ['backLink', 'sentence'])
      }
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-eventId`]: 'Select what this appointment is for',
        }
      }
      return res.render(`pages/arrange-appointment/sentence`, { crn, id, change, errors, back })
    }
  },
  postSentence: () => {
    return async (req, res) => {
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
        redirect = findUncompleted(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getTypeAttendance: () => {
    return async (req, res) => {
      const errors = req?.session?.data?.errors
      const { crn, id } = req.params
      const { change, validation } = req.query
      const { data } = req.session
      const url = encodeURIComponent(req.url)
      const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
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
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-type`]: 'Select a valid appointment type',
        }
      }
      return res.render(`pages/arrange-appointment/type-attendance`, { crn, id, url, change, errors })
    }
  },
  postTypeAttendance: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { number } = req.query as Record<string, string>
      const query = number ? `?number=${number}` : ''
      if (!isValidCrn(crn) || !isValidUUID(id) || (number && !isNumericString(number))) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/location-date-time${query}`
      if (change) {
        redirect = findUncompleted(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getWhoWillAttend: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const { data } = req.session
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
      }
      return res.render(`pages/arrange-appointment/attendance`, { crn, id, errors, change })
    }
  },
  postWhoWillAttend: hmppsAuthClient => {
    return async (req, res) => {
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
      if (providerCode) {
        setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
        setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
        setDataValue(data, ['appointments', crn, id, 'user', 'username'], username)
        await getOfficeLocationsByTeamAndProvider(hmppsAuthClient)(req, res)
        await getUserOptions(hmppsAuthClient)(req, res)
        checkAnswers(req, res)
      }
      if (req.session?.data?.appointments?.[crn]?.[id]?.temp) {
        delete req.session.data.appointments[crn][id].temp
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/type-attendance`
      if (change) {
        redirect = findUncompleted(req, res)
      }
      return res.redirect(redirect)
    }
  },

  getLocationDateTime: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data, alertDismissed = false } = req.session
      const { change, validation } = req.query as Record<string, string>
      const showValidation = validation === 'true'
      const isInPast = appointmentDateIsInPast(req)
      const { enablePastAppointments } = res.locals.flags
      if (showValidation) {
        const errorMessages = {
          [`appointments-${crn}-${id}-date`]: 'Enter or select a date',
          [`appointments-${crn}-${id}-start`]: 'Enter a start time',
          [`appointments-${crn}-${id}-end`]: 'Enter an end time',
        }
        if (!getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])) {
          errorMessages[`appointments-${crn}-${id}-user-locationCode`] = 'Select an appointment location'
        }
        res.locals.errorMessages = errorMessages
      }
      const isReschedule = isRescheduleAppointment(req)
      if (change) {
        const date = getDataValue(data, ['appointments', crn, id, 'date'])
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
      const { _minDate, _maxDate } = getMinMaxDates()
      res.locals.change = change as any

      return res.render(`pages/arrange-appointment/location-date-time`, {
        crn,
        id,
        _maxDate,
        errors,
        change,
        showValidation,
        isInPast,
        alertDismissed,
        isReschedule,
        ...(!enablePastAppointments ? { _minDate } : {}),
      })
    }
  },
  postLocationDateTime: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const path = ['appointments', crn, id]
      const appointment = getDataValue<AppointmentSession>(data, path)
      const { date, interval } = appointment
      const until = date
      setDataValue(data, [...path, 'numberOfAppointments'], '1')
      setDataValue(data, [...path, 'interval'], 'DAY')
      setDataValue(data, [...path, 'until'], until)
      if (change) {
        const originalDate = getDataValue(data, [...path, 'temp', 'date'])
        const updatedDate = getDataValue(data, [...path, 'date'])
        const originalDateWasInPast = getDataValue(data, [...path, 'temp', 'isInPast'])
        const updatedDateIsInPast = appointmentDateIsInPast(req)
        delete req.session.data.appointments[crn][id].temp.isInPast
        delete req.session.data.appointments[crn][id].temp.date
        const retainOutcomeRecorded = originalDateWasInPast && originalDate === updatedDate
        if (!retainOutcomeRecorded) {
          setDataValue(data, [...path, 'outcomeRecorded'], null)
        }
        const retainNotesAndSensitivity = (!originalDateWasInPast && !updatedDateIsInPast) || retainOutcomeRecorded
        if (!retainNotesAndSensitivity) {
          setDataValue(data, [...path, 'notes'], null)
          setDataValue(data, [...path, 'sensitivity'], null)
        }
      }

      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])
      let nextPage = res.locals?.flags?.enableSmsReminders ? `text-message-confirmation` : `supporting-information`

      if (selectedLocation === `LOCATION_NOT_IN_LIST`) {
        nextPage = `location-not-in-list`
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/${nextPage}`

      if (appointmentDateIsInPast(req)) redirect = `/case/${crn}/arrange-appointment/${id}/attended-complied`

      if (change && nextPage !== 'location-not-in-list') {
        redirect = findUncompleted(req, res)
      }
      if (change && nextPage === 'location-not-in-list') {
        redirect = `${redirect}?change=${change}`
      }
      return res.redirect(redirect)
    }
  },
  getAttendedComplied: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { alertDismissed = false } = req.session
      const { forename, surname, appointment } = getAttendedCompliedProps(req, res)
      const isReschedule = isRescheduleAppointment(req)
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
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/add-note${change ? `?change=${change}` : ''}`)
    }
  },
  getLocationNotInList: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change = undefined, noLocations = '' } = req.query
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id, noLocations, change })
    }
  },
  getAddNote: () => {
    return async (req, res) => {
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
      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config

      const { forename, appointment } = getAttendedCompliedProps(req, res)

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
      })
    }
  },
  postAddNote: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { change } = req.query as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(change ?? `/case/${crn}/arrange-appointment/${id}/check-your-answers`)
    }
  },
  getSupportingInformation: () => {
    return async (req, res) => {
      const { maxCharCount } = config
      const { crn, id } = req.params as Record<string, string>
      const { change, validation } = req.query
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-sensitivity`]: 'Select the sensitivity of the appointment',
        }
      }
      const isInPast = appointmentDateIsInPast(req)
      const back = 'date-time'
      return res.render(`pages/arrange-appointment/supporting-information`, {
        crn,
        id,
        back,
        change,
        showValidation,
        maxCharCount,
        isInPast,
      })
    }
  },
  postSupportingInformation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
      if (change) {
        redirect = findUncompleted(req, res)
      }
      return res.redirect(redirect)
    }
  },
  getCheckYourAnswers: () => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      let location = null
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
        location,
        url,
        isInPast,
      })
    }
  },
  postCheckYourAnswers: hmppsAuthClient => {
    return async (req, res) => appointmentSummary(req, res, hmppsAuthClient)
  },
  getConfirmation: hmppsAuthClient => {
    return async (req, res) => {
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      const { forename } = res.locals.case.name
      const url = encodeURIComponent(req.url)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const attending = getDataValue(data, ['appointments', crn, id, 'user'])
      let attendingName = 'Your '
      if (attending.username.toUpperCase() !== res.locals.user.username) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        try {
          const user = await masClient.getUserDetails(attending.username.toUpperCase())
          attendingName = `${forename}´s`
        } catch {
          attendingName = `The officer´s`
        }
      }
      // fetching backendId (appointmentId) to create 'anotherAppointment' link in confirmation.njk
      const backendId = getDataValue(data, ['appointments', crn, id, 'backendId'])
      const { isOutLookEventFailed } = data
      const isInPast = appointmentDateIsInPast(req)
      delete req.session.data.isOutLookEventFailed
      let appointmentType = null

      if (req.url.includes('reschedule')) {
        appointmentType = 'RESCHEDULE'
      }

      return res.render(`pages/arrange-appointment/confirmation`, {
        crn,
        backendId,
        isOutLookEventFailed,
        attendingName,
        url,
        isInPast,
        appointmentType,
      })
    }
  },
  postConfirmation: () => {
    return async (req, res) => {
      const { data } = req.session
      const url = encodeURIComponent(req.url)
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}?back=${url}`)
    }
  },

  getArrangeAnotherAppointment: () => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
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
  postArrangeAnotherAppointment: hmppsAuthClient => {
    return async (req, res) => appointmentSummary(req, res, hmppsAuthClient)
  },
  getTextMessageConfirmation: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      return res.render('pages/arrange-appointment/text-message-confirmation', { crn, id })
    }
  },
  postTextMessageConfirmation: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const url = encodeURIComponent(req.url)
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/supporting-information?back=${url}`)
    }
  },
}

export default arrangeAppointmentController
