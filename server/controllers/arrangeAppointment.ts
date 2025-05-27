import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { appointmentTypes } from '../properties'
import { getDataValue, isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'

const routes = [
  'redirectToType',
  'getOrPostType',
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
        return res.status(404).render('pages/error', { message: 'Page not found' })
      }
      return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/type`)
    }
  },
  getOrPostType: () => {
    return async (_req, res, next) => {
      res.locals.appointmentTypes = appointmentTypes
      return next()
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
      return res.render(`pages/arrange-appointment/type`, { crn, id, errors, change })
    }
  },
  postType: () => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const change = req?.query?.change as string
      const { number } = req.query as Record<string, string>
      const query = number ? `?number=${number}` : ''
      if (!isValidCrn(crn) || !isValidUUID(id) || (number && !isNumericString(number))) {
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
          return res.status(404).render('pages/error', { message: 'Page not found' })
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
      const { data } = req.session
      if (req?.body?.appointments?.[crn]?.[id]?.['sentence-licence-condition']) {
        setDataValue(data, ['appointments', crn, id, 'sentence-requirement'], '')
      }
      if (req?.body?.appointments?.[crn]?.[id]?.['sentence-requirement']) {
        // console.log('reset sentence-licence-condition!!!')
        setDataValue(data, ['appointments', crn, id, 'sentence-licence-condition'], '')
      }
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'location'])
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
        return res.status(404).render('pages/error', { message: 'Page not found' })
      }
      const redirect = change || `/case/${crn}/arrange-appointment/${id}/repeating`
      return res.redirect(redirect)
    }
  },
  getRepeating: () => {
    return async (req, res) => {
      const { data } = req.session
      const { crn, id } = req.params as Record<string, string>
      const { 'repeating-frequency': repeatingFrequency, 'repeating-count': repeatingCount } = req.query
      if (repeatingFrequency || repeatingCount) {
        setDataValue(data, ['appointments', crn, id, 'repeating'], 'Yes')
        if (repeatingFrequency) {
          setDataValue(data, ['appointments', crn, id, 'repeating-frequency'], decodeURI(repeatingFrequency as string))
        }
        if (repeatingCount) {
          setDataValue(data, ['appointments', crn, id, 'repeating-count'], repeatingCount)
        }
      }
      const appointment = getDataValue(data, ['appointments', crn, id])
      if (appointment?.date && appointment?.['repeating-frequency'] && appointment?.['repeating-count']) {
        const clonedAppointment = { ...appointment }
        const period = ['WEEK', 'FORTNIGHT'].includes(appointment['repeating-frequency']) ? 'week' : 'month'
        const increment = appointment['repeating-frequency'] === 'FORTNIGHT' ? 2 : 1
        const repeatAppointments = ArrangedSession.generateRepeatedAppointments(clonedAppointment, period, increment)
        setDataValue(
          data,
          ['appointments', crn, id, 'repeating-dates'],
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
      if (repeating === 'No, it’s a one-off appointment') {
        setDataValue(data, ['appointments', crn, id, 'repeating-count'], '')
        setDataValue(data, ['appointments', crn, id, 'repeating-frequency'], '')
        setDataValue(data, ['appointments', crn, id, 'repeating-dates'], [])
      }
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
      const selectedLocation = getDataValue(data, ['appointments', crn, id, 'location'])
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
        return res.status(404).render('pages/error', { message: 'Page not found' })
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
