import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { getDataValue, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails, PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { HmppsAuthClient } from '../data'
import supervisionAppointmentClient from '../../wiremock/stubs/supervisionAppointmentClient'
import { ESupervisionCheckIn, ESupervisionReview } from '../data/model/esupervision'
import ESupervisionClient from '../data/eSupervisionClient'

const routes = [
  'getIntroPage',
  'getDateFrequencyPage',
  'postIntroPage',
  'postDateFrequencyPage',
  'getContactPreferencePage',
  'postContactPreferencePage',
  'getPhotoOptionsPage',
  'getEditContactPrePage',
  'postEditContactPrePage',
  'postPhotoOptionsPage',
  'getTakePhotoPage',
  'getUploadPhotoPage',
  'postPhotoRulesPage',
  'getPhotoRulesPage',
  'getUpdateCheckIn',
  'getViewCheckIn',
  'getReviewExpiredCheckIn',
  'getReviewIdentityCheckIn',
  'postReviewIdentityCheckIn',
  'getReviewNotesCheckIn',
  'postReviewCheckIn',
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
      if (req?.session?.errorMessages) {
        res.locals.errorMessages = req.session.errorMessages
        delete req?.session?.errorMessages
      }
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const { data, back } = req.session
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)
      const checkInMobile = personalDetails.mobileNumber
      const checkInEmail = personalDetails.email
      // if page not submitted, required to save in session for change link /edit page to avoid API call.
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'editCheckInMobile'], checkInMobile)
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'editCheckInEmail'], checkInEmail)

      // To show success message on edit contact preference page
      const contactUpdated = getDataValue(data, ['esupervision', crn, id, 'checkins', 'contactUpdated'])
      if (contactUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.checkins?.contactUpdated
      }

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
  getEditContactPrePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.render('pages/check-in/edit-contact-preference.njk', { crn, id })
    }
  },

  postEditContactPrePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const editCheckInEmail = getDataValue(data, ['esupervision', crn, id, 'checkins', 'editCheckInEmail'])
      const editCheckInMobile = getDataValue(data, ['esupervision', crn, id, 'checkins', 'editCheckInMobile'])
      const body: PersonalDetailsUpdateRequest = {
        emailAddress: editCheckInEmail,
        mobileNumber: editCheckInMobile,
      }

      const personalDetails: PersonalDetails = await masClient.updatePersonalDetailsContact(crn, body)
      // Save to show success message on contact preferences page
      if (personalDetails?.crn) {
        setDataValue(data, ['esupervision', crn, id, 'checkins', 'contactUpdated'], true)
      }

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/contact-preference`)
    }
  },
  postPhotoOptionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const photoUploadOption = getDataValue(data, ['esupervision', crn, id, 'checkins', 'photoUploadOption'])
      const redirectTo = photoUploadOption === 'TAKE_A_PIC' ? 'take-a-photo' : 'upload-a-photo'

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/${redirectTo}`)
    }
  },

  getTakePhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/take-a-photo.njk', { crn, id })
    }
  },

  getUploadPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/upload-a-photo.njk', { crn, id })
    }
  },

  postPhotoRulesPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/photo-rules`)
    }
  },
  getPhotoRulesPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/photo-rules.njk', { crn, id })
    }
  },

  getUpdateCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
      const checkIn = checkInResponse.checkin

      if (checkIn.status === 'REVIEWED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/view?back=${back}`)
      }
      if (checkIn.status === 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/review/identity?back=${back}`)
      }
      if (checkIn.status === 'EXPIRED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/review/expired?back=${back}`)
      }
      return renderError(404)(req, res)
    }
  },

  getViewCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
      const checkIn = checkInResponse.checkin

      if (checkIn.status !== 'REVIEWED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update?back=${back}`)
      }
      return res.render('pages/check-in/view.njk', { crn, id, back, checkIn })
    }
  },

  getReviewExpiredCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
      const checkIn = checkInResponse.checkin

      if (checkIn.status !== 'EXPIRED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update?back=${back}`)
      }
      return res.render('pages/check-in/review/expired.njk', { crn, id, back, checkIn })
    }
  },

  getReviewIdentityCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
      const checkIn = checkInResponse.checkin

      if (checkIn.status !== 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update?back=${back}`)
      }
      return res.render('pages/check-in/review/identity.njk', { crn, id, back, checkIn })
    }
  },

  postReviewIdentityCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      let { url } = req
      url = encodeURIComponent(url)
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/review/notes?back=${url}`)
    }
  },

  getReviewNotesCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { data } = req.session
      const checkInSession = getDataValue(data, ['esupervision', crn, id, 'checkins'])
      if (checkInSession?.manualIdCheck === undefined) {
        return res.redirect(back ? (back as string) : `/case/${crn}/appointments/${id}/check-in/review/identity`)
      }

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
      const checkIn = checkInResponse.checkin

      if (checkIn.status !== 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update?back=${back}`)
      }
      return res.render('pages/check-in/review/notes.njk', { crn, id, back, checkIn })
    }
  },

  postReviewCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      let { url } = req
      url = encodeURIComponent(url)

      const { data } = req.session
      const checkIn = getDataValue(data, ['esupervision', crn, id, 'checkins'])

      const review: ESupervisionReview = {
        practitioner: res.locals.user.username,
        manualIdCheck: checkIn.manualIdCheck,
        missedCheckinComment: checkIn.note,
      }

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      await eSupervisionClient.postOffenderCheckInReview(id, review)

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/view?back=${url}`)
    }
  },
}

export default checkInsController
