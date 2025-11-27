import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { getDataValue, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails, PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { CheckinUserDetails } from '../models/ESupervision'
import { postCheckInDetails } from '../middleware/postCheckInDetails'
import logger from '../../logger'

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
  'postUploadaPhotoPage',
  'getPhotoRulesPage',
  'postPhotoRulesPage',
  'getCheckinSummaryPage',
  'postCheckinSummaryPage',
  'getConfirmationPage',
] as const

interface OptionPair {
  id: string
  label: string
}

const checkinIntervals: OptionPair[] = [
  { id: 'WEEKLY', label: 'Every week' },
  { id: 'TWO_WEEKS', label: 'Every 2 weeks' },
  { id: 'FOUR_WEEKS', label: 'Every 4 weeks' },
  { id: 'EIGHT_WEEKS', label: 'Every 8 weeks' },
]

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

  postUploadaPhotoPage: hmppsAuthClient => {
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
  postPhotoRulesPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/checkin-summary`)
    }
  },
  getCheckinSummaryPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const savedUserDetails = req.session.data?.esupervision?.[crn]?.[id]?.checkins
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const userDetails: CheckinUserDetails = {
        ...savedUserDetails,
        uuid: id,
        interval: checkinIntervals.find(option => option.id === savedUserDetails.interval).label,
        preferredComs: savedUserDetails.preferredComs === 'EMAIL' ? 'Email' : 'Text message',
        photoUploadOption:
          savedUserDetails.photoUploadOption === 'TAKE_A_PIC' ? 'Take a photo using this device' : 'Upload a photo',
      }
      return res.render('pages/check-in/checkin-summary.njk', { crn, id, userDetails })
    }
  },

  postCheckinSummaryPage: hmppsAuthClient => {
    return async (req, res) => {
      try {
        const { setup, uploadLocation } = await postCheckInDetails(hmppsAuthClient)(req, res)
        const responseBody = { status: 'SUCCESS', message: 'Registration complete', setup, uploadLocation }
        // Console/log output of the same payload we return to the client
        logger.info('Check-in registration response', responseBody)
        res.json(responseBody)
      } catch (e) {
        // postCheckInDetails already sent an error response; just stop.
      }
    }
  },

  getConfirmationPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const savedUserDetails = req.session.data?.esupervision?.[crn]?.[id]?.checkins
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const userDetails: CheckinUserDetails = {
        ...savedUserDetails,
        uuid: id,
        interval: checkinIntervals.find(option => option.id === savedUserDetails.interval).label,
        preferredComs: savedUserDetails.preferredComs === 'EMAIL' ? 'Email' : 'Text message',
        photoUploadOption:
          savedUserDetails.photoUploadOption === 'TAKE_A_PIC' ? 'Take a photo using this device' : 'Upload a photo',
      }
      return res.render('pages/check-in/confirmation.njk', { crn, id, userDetails })
    }
  },
}

export default checkInsController
