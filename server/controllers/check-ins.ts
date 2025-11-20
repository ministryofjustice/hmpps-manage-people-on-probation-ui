import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { isValidCrn, isValidUUID } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'

const routes = [
  'getIntroPage',
  'getDateFrequencyPage',
  'postIntroPage',
  'postDateFrequencyPage',
  'getContactPreferencePage',
  'postContactPreferencePage',
  'getPhotoOptionsPage',
] as const

const checkInsController: Controller<typeof routes, void> = {
  getIntroPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/instructions.njk', { crn })
    }
  },

  postIntroPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      const id = uuidv4()
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/date-frequency`)
    }
  },

  getDateFrequencyPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const today = new Date()
      // setting temporary fix for minDate
      // (https://github.com/ministryofjustice/moj-frontend/issues/923)
      let checkInMinDate: string
      today.setDate(today.getDate() + 1)
      if (today.getDate() > 9) {
        checkInMinDate = DateTime.fromJSDate(today).toFormat('dd/M/yyyy')
      } else {
        checkInMinDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
      }
      return res.render(`pages/check-in/date-frequency.njk`, { crn, id, checkInMinDate })
    }
  },

  postDateFrequencyPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/contact-preference`)
    }
  },

  getContactPreferencePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)
      const checkInMobile = personalDetails.mobileNumber
      const checkInEmail = personalDetails.email
      return res.render('pages/check-in/contact-preference.njk', { crn, id, checkInMobile, checkInEmail })
    }
  },

  postContactPreferencePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/photo-options`)
    }
  },

  getPhotoOptionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.render('pages/check-in/photo-options.njk', { crn, id })
    }
  },
}

export default checkInsController
