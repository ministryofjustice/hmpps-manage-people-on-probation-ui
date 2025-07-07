import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller, Route } from '../@types'
import { getDataValue, isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'
import { renderError, postAppointments } from '../middleware'
import { AppointmentSession } from '../models/Appointments'
import { HmppsAuthClient } from '../data'

const routes = [
  'redirectToType',
  'getType',
  'postType',
  'getSentence',
  'postSentence',
  'getWhoWillAttend',
  'postWhoWillAttend',
  'getLocation',
  'postLocation',
  'getLocationNotInList',
  'getDateTime',
  'postDateTime',
  'getRepeating',
  'postRepeating',
  'getNotes',
  'postNotes',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getConfirmation',
  'postConfirmation',
  'getArrangeAnotherAppointment',
  'postArrangeAnotherAppointment',
] as const

const arrangeAppointmentController: Controller<typeof routes> = {
  redirectToType: () => {
    return async (req, res) => {
      const uuid = uuidv4()
      const { crn } = req.params
      if (!isValidCrn(crn) || !isValidUUID(uuid)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/type`)
    }
  },
  getType: () => {
    return async (req, res) => {
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
      }
      const { crn, id } = req.params
      const { change } = req.query
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/sentence${query}`
      return res.redirect(redirect)
    }
  },
  getSentence: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const requiredValues = ['type']
      for (const requiredValue of requiredValues) {
        const value = getDataValue(data, ['appointments', crn, id, requiredValue])
        if (!value) {
          if (isValidCrn(crn) && isValidUUID(id)) {
            return res.redirect(`/case/${crn}/arrange-appointment/${id}/type`)
          }
          return renderError(404)(req, res)
        }
      }
      const { change } = req.query
      return res.render(`pages/arrange-appointment/sentence`, { crn, id, change })
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

      const redirect = change || `/case/${crn}/arrange-appointment/${id}/attendance${queryParameters}`
      return res.redirect(redirect)
    }
  },
  getWhoWillAttend: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
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
      const { change, page, providerCode, teamCode } = req.query as Record<string, string>
      const teamQueryParam = teamCode ? `&teamCode=${teamCode}` : ''
      const queryParameters = providerCode ? `?providerCode=${providerCode}${teamQueryParam}` : ''
      if (page) {
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/attendance${queryParameters}`)
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
      const { change } = req.query
      const errors = data?.errors
      const { appointment } = res.locals
      const locations = res?.locals?.userLocations || []
      if (errors) {
        delete req.session.data.errors
      }
      if (!locations?.length && appointment.type?.isLocationRequired) {
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/location-not-in-list?noLocations=true`)
      }
      return res.render(`pages/arrange-appointment/location`, { crn, id, errors, change })
    }
  },
  postLocation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { data } = req.session
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const page =
        selectedLocation === `The location I’m looking for is not in this list` ? 'location-not-in-list' : 'date-time'
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/${page}`
      return res.redirect(redirect)
    }
  },
  getLocationNotInList: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { noLocations = '' } = req.query
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id, noLocations })
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
      const minDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
      return res.render(`pages/arrange-appointment/date-time`, {
        crn,
        id,
        minDate,
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
      const { numberOfAppointments, numberOfRepeatAppointments, until, date, interval } =
        getDataValue<AppointmentSession>(data, path)
      if (!numberOfAppointments) {
        setDataValue(data, [...path, 'numberOfAppointments'], '1')
      }
      if (!numberOfRepeatAppointments) {
        setDataValue(data, [...path, 'numberOfRepeatAppointments'], '0')
      }
      if (!until) {
        setDataValue(data, [...path, 'until'], date)
      }
      if (!interval) {
        setDataValue(data, [...path, 'interval'], 'DAY')
      }
      const nextPage = repeatAppointmentsEnabled
        ? `/case/${crn}/arrange-appointment/${id}/repeating`
        : `/case/${crn}/arrange-appointment/${id}/add-notes`
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/add-notes`
      return res.redirect(redirect)
    }
  },
  getNotes: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const repeatAppointmentsEnabled = res.locals.flags.enableRepeatAppointments === true
      const back = !repeatAppointmentsEnabled ? 'date-time' : 'repeating'
      return res.render(`pages/arrange-appointment/add-notes`, { crn, id, back, change })
    }
  },
  postNotes: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/check-your-answers`)
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
      if (
        ![`The location I’m looking for is not in this list`, 'I do not need to pick a location'].includes(
          selectedLocation,
        )
      ) {
        location = res.locals.userLocations.find((loc: any) => loc.description === selectedLocation)
      }
      return res.render(`pages/arrange-appointment/check-your-answers`, { crn, id, location, url, repeatingEnabled })
    }
  },
  postCheckYourAnswers: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      await postAppointments(hmppsAuthClient)(req, res)
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    }
  },
  getConfirmation: () => {
    return async (req, res) => {
      const { crn } = req.params
      return res.render(`pages/arrange-appointment/confirmation`, { crn })
    }
  },
  postConfirmation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const uuid = uuidv4()
      const { data } = req.session
      const currentAppt = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
      const copiedAppt: AppointmentSession = {
        ...currentAppt,
        date: '',
        start: '',
        end: '',
        repeatingDates: [] as string[],
        until: '',
        numberOfAppointments: '1',
        numberOfRepeatAppointments: '0',
      }
      setDataValue(data, ['appointments', crn, uuid], copiedAppt)
      return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
    }
  },
  getArrangeAnotherAppointment: () => {
    return async (req, res) => {
      const { url } = req
      const { crn, id } = req.params as Record<string, string>
      return res.render(`pages/arrange-appointment/arrange-another-appointment`, { url, crn, id })
    }
  },
  postArrangeAnotherAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const date = getDataValue(data, ['appointments', crn, id, 'date'])
      if (!date) {
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/date-time?validation=true&change=${req.url}`)
      }
      await postAppointments(hmppsAuthClient)(req, res)
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    }
  },
}

export default arrangeAppointmentController
