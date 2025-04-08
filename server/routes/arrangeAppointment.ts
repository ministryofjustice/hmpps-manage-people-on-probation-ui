import { type Router } from 'express'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getUserLocations,
  getSentences,
  getAppointment,
  redirectWizard,
} from '../middleware/index'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { setDataValue, getDataValue } from '../utils'
import { ArrangedSession } from '../models/ArrangedSession'
import { postAppointments } from '../middleware/postAppointments'
import { appointmentTypes } from '../properties'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { AppResponse, Route } from '../@types'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all('/case/:crn/arrange-appointment/:id/*', (req, res: AppResponse, next) => {
    res.locals.change = req.query.change as string
    return next()
  })
  get('/case/:crn/arrange-appointment/type', async (req, res, _next) => {
    const id = uuidv4()
    const { crn } = req.params
    return res.redirect(`/case/${crn}/arrange-appointment/${id}/type`)
  })
  router.all('/case/:crn/arrange-appointment/:id/type', (_req, res: AppResponse, next) => {
    res.locals.appointmentTypes = appointmentTypes
    return next()
  })
  get('/case/:crn/arrange-appointment/:id/type', async (req, res, _next) => {
    const errors = req?.session?.data?.errors
    if (errors) {
      delete req.session.data.errors
    }
    const { crn, id } = req.params
    const { change } = req.query
    return res.render(`pages/arrange-appointment/type`, { crn, id, errors, change })
  })
  router.all('/case/:crn/arrange-appointment/:id/*', getAppointment)
  router.post('/case/:crn/arrange-appointment/:id/*', autoStoreSessionData)

  router.post('/case/:crn/arrange-appointment/:id/type', validate.appointments, (req, res, _next) => {
    const { crn, id } = req.params
    const change = req?.query?.change as string
    const query = req?.query?.number ? `?number=${req.query.number}` : ''
    const redirect = change || `/case/${crn}/arrange-appointment/${id}/sentence${query}`
    return res.redirect(redirect)
  })

  router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))

  router.get('/case/:crn/arrange-appointment/:id/sentence', redirectWizard(['type']), (req, res, _next) => {
    const { crn, id } = req.params
    const { data } = req.session
    const requiredValues = ['type']

    for (const requiredValue of requiredValues) {
      const value = getDataValue(data, ['appointments', crn, id, requiredValue])
      if (!value) {
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/type`)
      }
    }
    const { change } = req.query
    return res.render(`pages/arrange-appointment/sentence`, { crn, id, change })
  })

  router.post('/case/:crn/arrange-appointment/:id/sentence', validate.appointments, (req, res, _next) => {
    const { crn, id } = req.params
    const change = req?.query?.change as string
    const { data } = req.session
    if (req?.body?.appointments?.[crn]?.[id]?.['sentence-licence-condition']) {
      setDataValue(data, ['appointments', crn, id, 'sentence-requirement'], '')
    }
    if (req?.body?.appointments?.[crn]?.[id]?.['sentence-requirement']) {
      setDataValue(data, ['appointments', crn, id, 'sentence-licence-condition'], '')
    }
    const redirect = change || `/case/${crn}/arrange-appointment/${id}/location`
    return res.redirect(redirect)
  })

  router.all('/case/:crn/arrange-appointment/:id/location', getUserLocations(hmppsAuthClient))

  router.get(
    '/case/:crn/arrange-appointment/:id/location',
    redirectWizard(['type', 'sentence']),
    async (req, res, _next) => {
      const { crn, id } = req.params
      const { change } = req.query
      const errors = req?.session?.data?.errors
      if (errors) {
        delete req.session.data.errors
      }
      return res.render(`pages/arrange-appointment/location`, { crn, id, errors, change })
    },
  )

  router.post('/case/:crn/arrange-appointment/:id/location', validate.appointments, (req, res, _next) => {
    const { crn, id } = req.params
    const change = req?.query?.change as string
    const { data } = req.session
    const selectedLocation = getDataValue(data, ['appointments', crn, id, 'location'])
    const page =
      selectedLocation === `The location I’m looking for is not in this list` ? 'location-not-in-list' : 'date-time'
    const redirect = change || `/case/${crn}/arrange-appointment/${id}/${page}`
    return res.redirect(redirect)
  })

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    getPersonalDetails(hmppsAuthClient),
    async (req, res, _next) => {
      const { crn, id } = req.params
      return res.render(`pages/arrange-appointment/location-not-in-list`, { crn, id })
    },
  )

  router.all('/case/:crn/arrange-appointment/:id/date-time', getPersonalDetails(hmppsAuthClient), getTimeOptions)

  router.get(
    '/case/:crn/arrange-appointment/:id/date-time',
    redirectWizard(['type', 'sentence', 'location']),
    async (req, res, _next) => {
      const { crn, id } = req.params
      const { change } = req.query
      const today = new Date()
      const minDate = DateTime.fromJSDate(today).toFormat('dd/MM/yyyy')
      return res.render(`pages/arrange-appointment/date-time`, { crn, id, minDate, change })
    },
  )
  router.post('/case/:crn/arrange-appointment/:id/date-time', validate.appointments, (req, res, _next) => {
    const { crn, id } = req.params
    const change = req?.query?.change as string
    const redirect = change || `/case/${crn}/arrange-appointment/${id}/repeating`
    return res.redirect(redirect)
  })

  router.get(
    '/case/:crn/arrange-appointment/:id/repeating',
    redirectWizard(['type', 'sentence', 'location', 'date']),
    async (req, res: AppResponse, _next) => {
      const { data } = req.session
      const { crn, id } = req.params
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
    },
  )

  router.post('/case/:crn/arrange-appointment/:id/repeating', validate.appointments, (req, res, _next) => {
    const { crn, id } = req.params
    const change = req?.query?.change as string
    const { data } = req.session
    const redirect = change || `/case/${crn}/arrange-appointment/${id}/preview`
    const repeating = getDataValue(data, ['appointments', crn, id, 'repeating'])
    if (repeating === 'No, it’s a one-off appointment') {
      setDataValue(data, ['appointments', crn, id, 'repeating-count'], '')
      setDataValue(data, ['appointments', crn, id, 'repeating-frequency'], '')
      setDataValue(data, ['appointments', crn, id, 'repeating-dates'], [])
    }
    return res.redirect(redirect)
  })
  router.get(
    '/case/:crn/arrange-appointment/:id/preview',
    redirectWizard(['type', 'sentence', 'location', 'date', 'repeating']),
    async (req, res, _next) => {
      const { crn, id } = req.params
      return res.render(`pages/arrange-appointment/preview`, { crn, id })
    },
  )
  router.post('/case/:crn/arrange-appointment/:id/preview', async (req, res, _next) => {
    const { crn, id } = req.params
    return res.redirect(`/case/${crn}/arrange-appointment/${id}/check-your-answers`)
  })
  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['type', 'sentence', 'location', 'date', 'repeating']),
    getUserLocations(hmppsAuthClient),
    async (req, res: AppResponse, _next) => {
      const { params, url } = req
      const { crn, id } = params
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
    },
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    postAppointments(hmppsAuthClient),
    async (req, res, _next) => {
      const { crn, id } = req.params
      return res.redirect(`/case/${crn}/arrange-appointment/${id}/confirmation`)
    },
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    getPersonalDetails(hmppsAuthClient),
    async (_req, res, _next) => {
      return res.render(`pages/arrange-appointment/confirmation`)
    },
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', async (_req, res, _next) => {
    return res.redirect('/')
  })
}

export default arrangeAppointmentRoutes
