/* eslint-disable no-underscore-dangle */
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Request } from 'express'
import { Controller } from '../@types'
import { getDataValue, getPersonLevelTypes, isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'
import { renderError, postAppointments } from '../middleware'
import { AppointmentSession, AppointmentsPostResponse } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import config from '../config'
import { findUncompleted } from '../utils/findUncompleted'
import MasApiClient from '../data/masApiClient'

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
  'getLocationNotInList',
  'getRepeating',
  'postRepeating',
  'getSupportingInformation',
  'postSupportingInformation',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getConfirmation',
  'postConfirmation',
  'getArrangeAnotherAppointment',
  'postArrangeAnotherAppointment',
] as const

export const appointmentSummary = async (req: Request, res: AppResponse, client: HmppsAuthClient) => {
  const { data } = req.session
  const { crn, id } = req.params as Record<string, string>
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
  const baseUrl = `/case/${crn}/arrange-appointment/${id}`
  for (const [k, v] of Object.entries(mapping)) {
    const value = requiredValues[k as keyof typeof requiredValues]
    if (!value) {
      return res.redirect(`${baseUrl}/${v}?validation=true&change=${req.url}`)
    }
  }
  const response: AppointmentsPostResponse = await postAppointments(client)(req, res)
  setDataValue(data, ['appointments', crn, id, 'backendId'], response.appointments[response.appointments.length - 1].id)
  return res.redirect(`${baseUrl}/confirmation`)
}

const arrangeAppointmentController: Controller<typeof routes, void> = {
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
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
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
      let { url } = req
      url = encodeURIComponent(url)
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
      const { data } = req.session
      const change = req?.query?.change as string
      const { number } = req.query as Record<string, string>
      const query = number ? `?number=${number}` : ''
      if (!isValidCrn(crn) || !isValidUUID(id) || (number && !isNumericString(number))) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/location-date-time${query}`
      if (change) {
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
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
  postWhoWillAttend: () => {
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
        setDataValue(data, ['appointments', crn, id, 'user'], { teamCode, providerCode, username })
      }
      if (req.session?.data?.appointments?.[crn]?.[id]?.temp) {
        delete req.session.data.appointments[crn][id].temp
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/location-date-time`
      if (change) {
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
      }
      return res.redirect(redirect)
    }
  },

  getLocationDateTime: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const { change, validation } = req.query
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-date`]: 'Enter or select a date',
          [`appointments-${crn}-${id}-start`]: 'Enter a start time',
          [`appointments-${crn}-${id}-end`]: 'Enter an end time',
          [`appointments-${crn}-${id}-user-locationCode`]: 'Select an appointment location',
        }
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
      const today = new Date()
      // setting temporary fix for minDate
      // (https://github.com/ministryofjustice/moj-frontend/issues/923)

      let _minDate: string
      if (today.getDate() > 9) {
        today.setDate(today.getDate() - 1)
        _minDate = DateTime.fromJSDate(today).toFormat('dd/M/yyyy')
      } else {
        _minDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
      }
      const _maxDate = DateTime.fromISO('2199-12-31').toFormat('d/M/yyyy')

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personRisks = await masClient.getPersonRiskFlags(crn)
      return res.render(`pages/arrange-appointment/location-date-time`, {
        crn,
        id,
        _minDate,
        _maxDate,
        errors,
        change,
        showValidation,
        personRisks,
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
      const repeatAppointmentsEnabled = res?.locals?.flags?.enableRepeatAppointments === true
      const path = ['appointments', crn, id]
      const appointment = getDataValue<AppointmentSession>(data, path)
      const { date, interval } = appointment
      let until = date
      let repeatingDates = [] as string[]
      if (change && repeatAppointmentsEnabled) {
        const period = ['WEEK', 'FORTNIGHT'].includes(interval) ? 'week' : 'month'
        const increment = interval === 'FORTNIGHT' ? 2 : 1
        const repeatAppointments = ArrangedSession.generateRepeatedAppointments(appointment, period, increment) ?? []
        repeatingDates = repeatAppointments.map(appt => appt.date)
        until = repeatAppointments.length ? repeatAppointments[repeatAppointments.length - 1].date : ''
      } else {
        setDataValue(data, [...path, 'numberOfAppointments'], '1')
        setDataValue(data, [...path, 'numberOfRepeatAppointments'], '')
        setDataValue(data, [...path, 'interval'], 'DAY')
      }
      setDataValue(data, [...path, 'until'], until)
      setDataValue(data, [...path, 'repeatingDates'], repeatingDates)
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])
      let nextPage = repeatAppointmentsEnabled ? `repeating` : `supporting-information`
      if (selectedLocation === `LOCATION_NOT_IN_LIST`) {
        nextPage = `location-not-in-list`
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/${nextPage}`
      if (change && nextPage !== 'location-not-in-list') {
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
      }
      if (change && nextPage === 'location-not-in-list') {
        redirect = `${redirect}?change=${change}`
      }
      return res.redirect(redirect)
    }
  },
  getLocationNotInList: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change = undefined, noLocations = '' } = req.query
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id, noLocations, change })
    }
  },
  getRepeating: () => {
    return async (req, res) => {
      if (res.locals.flags.enableRepeatAppointments !== true) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      const { interval, numberOfRepeatAppointments } = req.query
      if (interval || numberOfRepeatAppointments) {
        setDataValue(data, ['appointments', crn, id, 'repeating'], 'Yes')
        if (interval) {
          setDataValue(data, ['appointments', crn, id, 'interval'], decodeURI(interval as string))
        }
        if (numberOfRepeatAppointments) {
          setDataValue(data, ['appointments', crn, id, 'numberOfRepeatAppointments'], numberOfRepeatAppointments)
        }
      }
      const appointment = getDataValue(data, ['appointments', crn, id])
      if (appointment?.date && appointment?.interval && appointment?.numberOfRepeatAppointments) {
        const clonedAppointment = { ...appointment }
        const period = ['WEEK', 'FORTNIGHT'].includes(appointment.interval) ? 'week' : 'month'
        const increment = appointment.interval === 'FORTNIGHT' ? 2 : 1
        const repeatAppointments = ArrangedSession.generateRepeatedAppointments(clonedAppointment, period, increment)
        setDataValue(
          data,
          ['appointments', crn, id, 'repeatingDates'],
          repeatAppointments.map(appt => appt.date),
        )
        res.locals.lastAppointmentDate = repeatAppointments.length
          ? repeatAppointments[repeatAppointments.length - 1].date
          : ''
      }
      return res.render(`pages/arrange-appointment/repeating`, { crn, id })
    }
  },
  postRepeating: () => {
    return async (req, res) => {
      if (res?.locals?.flags?.enableRepeatAppointments !== true) {
        return renderError(404)(req, res)
      }
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const change = req?.query?.change as string
      const { data } = req.session
      const { repeating, numberOfRepeatAppointments = '0' } = getDataValue<AppointmentSession>(data, [
        'appointments',
        crn,
        id,
      ])
      if (repeating === 'No') {
        const updatedAppointment: AppointmentSession = {
          ...(data?.appointments?.[crn]?.[id] || {}),
          repeating: 'No',
          numberOfRepeatAppointments: '0',
          numberOfAppointments: '1',
          interval: 'DAY',
          repeatingDates: [] as string[],
          until: getDataValue(data, ['appointments', crn, id, 'date']),
        }
        setDataValue(req.session.data, ['appointments', crn, id], updatedAppointment)
      } else {
        setDataValue(
          data,
          ['appointments', crn, id, 'numberOfAppointments'],
          parseInt(numberOfRepeatAppointments, 10) + 1,
        )
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/supporting-information`
      if (change) {
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
      }
      return res.redirect(redirect)
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
      const repeatAppointmentsEnabled = res.locals.flags.enableRepeatAppointments === true
      const back = !repeatAppointmentsEnabled ? 'date-time' : 'repeating'
      return res.render(`pages/arrange-appointment/supporting-information`, {
        crn,
        id,
        back,
        change,
        showValidation,
        maxCharCount,
      })
    }
  },
  postSupportingInformation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      let redirect = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
      if (change) {
        redirect = findUncompleted(getDataValue(data, ['appointments', crn, id]), crn, id, change)
      }
      return res.redirect(redirect)
    }
  },
  getCheckYourAnswers: () => {
    return async (req, res) => {
      const repeatingEnabled = res.locals.flags.enableRepeatAppointments === true
      const { url } = req
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      let location = null
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])
      if (![`LOCATION_NOT_IN_LIST`, 'NO_LOCATION_REQUIRED'].includes(selectedLocation)) {
        location = res.locals.userLocations.find((loc: any) => loc.description === selectedLocation)
      }
      return res.render(`pages/arrange-appointment/check-your-answers`, { crn, id, location, url, repeatingEnabled })
    }
  },
  postCheckYourAnswers: hmppsAuthClient => {
    return async (req, res) => appointmentSummary(req, res, hmppsAuthClient)
  },
  getConfirmation: () => {
    return async (req, res) => {
      const { crn } = req.params
      const { data } = req.session
      return res.render(`pages/arrange-appointment/confirmation`, { crn })
    }
  },
  postConfirmation: () => {
    return async (req, res) => {
      const { data } = req.session
      const { url } = req
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const backendId = getDataValue(data, ['appointments', crn, id, 'backendId'])
      return res.redirect(`/case/${crn}/appointments/appointment/${backendId}/next-appointment?back=${url}`)
    }
  },

  getArrangeAnotherAppointment: () => {
    return async (req, res) => {
      const { url } = req
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!getDataValue<AppointmentSession>(data, ['appointments', crn, id])) {
        return res.redirect(`/case/${crn}/appointments`)
      }
      return res.render(`pages/arrange-appointment/arrange-another-appointment`, { url, crn, id })
    }
  },
  postArrangeAnotherAppointment: hmppsAuthClient => {
    return async (req, res) => appointmentSummary(req, res, hmppsAuthClient)
  },
}

export default arrangeAppointmentController
