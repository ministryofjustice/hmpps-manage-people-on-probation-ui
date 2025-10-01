/* eslint-disable no-underscore-dangle */
import { v4 as uuidv4, v4 } from 'uuid'
import { DateTime } from 'luxon'
import { Request } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { Controller } from '../@types'
import { getDataValue, getPersonLevelTypes, isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'
import { renderError, postAppointments, cloneAppointmentAndRedirect } from '../middleware'
import { AppointmentSession, AppointmentsPostResponse } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import config from '../config'
import MasApiClient from '../data/masApiClient'

const routes = [
  'redirectToSentence',
  'getSentence',
  'postSentence',
  'getType',
  'postType',
  'getWhoWillAttend',
  'postWhoWillAttend',
  'getLocation',
  'postLocation',
  'getLocationNotInList',
  'getDateTime',
  'postDateTime',
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
    type: 'type',
    providerCode: 'attendance',
    teamCode: 'attendance',
    username: 'attendance',
    locationCode: 'location',
    date: 'date-time',
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
  console.log(response)
  setDataValue(data, ['appointments', crn, id, 'backendId'], response.appointments[response.appointments.length - 1].id)
  return res.redirect(`${baseUrl}/confirmation`)
}

const arrangeAppointmentController: Controller<typeof routes, void> = {
  redirectToSentence: () => {
    return async (req, res) => {
      const uuid = uuidv4()
      const { crn } = req.params
      if (!isValidCrn(crn) || !isValidUUID(uuid)) {
        return renderError(404)(req, res)
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
      const { change, validation, back } = req.query
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-eventId`]: 'Select a sentence',
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/type${queryParameters}`
      return res.redirect(redirect)
    }
  },
  getType: () => {
    return async (req, res) => {
      const errors = req?.session?.data?.errors
      const { crn, id } = req.params
      const { change, validation } = req.query
      const { data } = req.session
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
      return res.render(`pages/arrange-appointment/type`, { crn, id, change, errors })
    }
  },
  postType: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { number } = req.query as Record<string, string>
      const query = number ? `?number=${number}` : ''
      if (!isValidCrn(crn) || !isValidUUID(id) || (number && !isNumericString(number))) {
        return renderError(404)(req, res)
      }
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/attendance${query}`
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/location`
      return res.redirect(redirect)
    }
  },

  getLocation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const { change, validation } = req.query
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
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
      return res.render(`pages/arrange-appointment/location`, { crn, id, errors, change, showValidation })
    }
  },
  postLocation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query as Record<string, string>
      const { data } = req.session
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const page = selectedLocation === `LOCATION_NOT_IN_LIST` ? 'location-not-in-list' : 'date-time'
      let redirect = `/case/${crn}/arrange-appointment/${id}/${page}`
      if (change && page !== 'location-not-in-list') {
        redirect = change
      }
      if (change && page === 'location-not-in-list') {
        redirect = `${redirect}?change=${change}`
      }
      return res.redirect(redirect)
    }
  },
  getLocationNotInList: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { noLocations = '' } = req.query
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id, noLocations, change })
    }
  },
  getDateTime: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change, validation } = req.query
      const showValidation = validation === 'true'
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-date`]: 'Enter or select a date',
          [`appointments-${crn}-${id}-start`]: 'Select a start time',
          [`appointments-${crn}-${id}-end`]: 'Select an end time',
        }
      }
      const today = new Date()
      const _minDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
      const _maxDate = DateTime.fromISO('2199-12-31').toFormat('d/M/yyyy')
      return res.render(`pages/arrange-appointment/date-time`, {
        crn,
        id,
        _minDate,
        _maxDate,
        change,
        showValidation,
      })
    }
  },
  postDateTime: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const repeatAppointmentsEnabled = res?.locals?.flags?.enableRepeatAppointments === true
      const { data } = req.session
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
      const nextPage = repeatAppointmentsEnabled
        ? `/case/${crn}/arrange-appointment/${id}/repeating`
        : `/case/${crn}/arrange-appointment/${id}/supporting-information`
      const redirect = change || nextPage
      return res.redirect(redirect)
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/supporting-information`
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
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/check-your-answers`
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
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const backendId = getDataValue(data, ['appointments', crn, id, 'backendId'])
      return res.redirect(`/case/${crn}/appointments/appointment/${backendId}/next-appointment`)
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
