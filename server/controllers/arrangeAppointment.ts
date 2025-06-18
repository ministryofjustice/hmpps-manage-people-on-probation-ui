import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { getDataValue, isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'

const routes = [
  'redirectToType',
  'getType',
  'postType',
  'getSentence',
  'postSentence',
  'getLocation',
  'postLocation',
  'getLocationNotInList',
  'getDateTime',
  'postDateTime',
  'getRepeating',
  'postRepeating',
  'getPreview',
  'postPreview',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getConfirmation',
  'postConfirmation',
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
      return res.render(`pages/arrange-appointment/type`, { crn, id, errors })
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
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/location`
      return res.redirect(redirect)
    }
  },
  getLocation: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
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
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id })
    }
  },
  getDateTime: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      const today = new Date()
      const minDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
      return res.render(`pages/arrange-appointment/date-time`, { crn, id, minDate, change })
    }
  },
  postDateTime: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/repeating`
      return res.redirect(redirect)
    }
  },
  getRepeating: () => {
    return async (req, res) => {
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      const { interval, numberOfAppointments } = req.query
      if (interval || numberOfAppointments) {
        setDataValue(data, ['appointments', crn, id, 'repeating'], 'Yes')
        if (interval) {
          setDataValue(data, ['appointments', crn, id, 'interval'], decodeURI(interval as string))
        }
        if (numberOfAppointments) {
          setDataValue(data, ['appointments', crn, id, 'numberOfAppointments'], numberOfAppointments)
        }
      }
      const appointment = getDataValue(data, ['appointments', crn, id])
      if (appointment?.date && appointment?.interval && appointment?.numberOfAppointments) {
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
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { data } = req.session
      const repeating = getDataValue(data, ['appointments', crn, id, 'repeating'])
      if (repeating === 'No') {
        setDataValue(data, ['appointments', crn, id, 'numberOfAppointments'], '')
        setDataValue(data, ['appointments', crn, id, 'interval'], '')
        setDataValue(data, ['appointments', crn, id, 'repeatingDates'], [])
      }
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/preview`
      return res.redirect(redirect)
    }
  },
  getPreview: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      return res.render(`pages/arrange-appointment/preview`, { crn, id })
    }
  },
  postPreview: () => {
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
      return res.render(`pages/arrange-appointment/check-your-answers`, { crn, id, location, url })
    }
  },
  postCheckYourAnswers: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    }
  },
  getConfirmation: () => {
    return async (_req, res) => res.render(`pages/arrange-appointment/confirmation`)
  },
  postConfirmation: () => {
    return async (_req, res) => res.redirect('/')
  },
}

export default arrangeAppointmentController
