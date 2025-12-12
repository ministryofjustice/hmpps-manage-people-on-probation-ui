import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { NextFunction, Request, Response } from 'express'
import { Controller, Route } from '../@types'
import { dayOfWeek, getDataValue, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails, PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { ESupervisionNote, ESupervisionReview } from '../data/model/esupervision'
import ESupervisionClient from '../data/eSupervisionClient'
import { CheckinUserDetails } from '../models/ESupervision'
import { postCheckInDetails } from '../middleware/postCheckInDetails'
import logger from '../../logger'
import { postCheckinInComplete } from '../middleware/postCheckinComplete'
import { ProbationPractitioner } from '../models/CaseDetail'

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
  'getUpdateCheckIn',
  'getViewCheckIn',
  'getReviewExpiredCheckIn',
  'getReviewIdentityCheckIn',
  'postReviewIdentityCheckIn',
  'getReviewNotesCheckIn',
  'postReviewCheckIn',
  'postPhotoRulesPage',
  'getCheckinSummaryPage',
  'postCheckinSummaryPage',
  'getConfirmationPage',
  'getCheckinVideoPage',
  'postTakeAPhotoPage',
  'postViewCheckIn',
  'getManageCheckinPage',
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
      const { back } = req.query
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/instructions.njk', { crn, back })
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
      const cya = req.query.cya === 'true'
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
      return res.render(`pages/check-in/date-frequency.njk`, { crn, id, checkInMinDate, cya })
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
      const { data } = req.session
      const { cya } = req.query
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
      return res.render('pages/check-in/contact-preference.njk', { crn, id, checkInMobile, checkInEmail, cya })
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
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/photo-options.njk', { crn, id, cya })
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
      let cyaQuery = ''
      if (req.query?.cya === 'true') {
        cyaQuery = '?cya=true'
      }
      const personalDetails: PersonalDetails = await masClient.updatePersonalDetailsContact(crn, body)
      // Save to show success message on contact preferences page
      if (personalDetails?.crn) {
        setDataValue(data, ['esupervision', crn, id, 'checkins', 'contactUpdated'], true)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/contact-preference${cyaQuery}`)
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
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/take-a-photo.njk', { crn, id, cya })
    }
  },

  getUploadPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/upload-a-photo.njk', { crn, id, cya })
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
      const { photoUpload } = req.query
      return res.render('pages/check-in/photo-rules.njk', { crn, id, photoUpload })
    }
  },

  getUpdateCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { checkIn } = res.locals
      const statusMap = {
        REVIEWED: 'view',
        SUBMITTED: 'review/identity',
        EXPIRED: 'review/expired',
      }
      if (Object.keys(statusMap).includes(checkIn.status)) {
        return res.redirect(
          `/case/${crn}/appointments/${id}/check-in/${statusMap[checkIn.status]}${back ? `?back=${back}` : ''}`,
        )
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

      const { checkIn } = res.locals

      const url = encodeURIComponent(req.url)
      const videoLink = `/case/${crn}/appointments/${id}/check-in/video?back=${url}`

      if (checkIn.status !== 'REVIEWED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
      }
      return res.render('pages/check-in/view.njk', { crn, id, back, checkIn, videoLink })
    }
  },

  postViewCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const { data } = req.session
      const checkIn = getDataValue(data, ['esupervision', crn, id, 'checkins'])

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

      const masClient = new MasApiClient(token)
      const pp: ProbationPractitioner = await masClient.getProbationPractitioner(crn)
      const practitionerId = pp?.username ? pp.username : res.locals.user.username

      const eSupervisionClient = new ESupervisionClient(token)
      const notes: ESupervisionNote = {
        updatedBy: practitionerId,
        notes: checkIn.note,
      }
      await eSupervisionClient.postOffenderCheckInNote(id, notes)

      return res.redirect(`/case/${crn}/activity-log`)
    }
  },

  getReviewExpiredCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { checkIn } = res.locals
      if (checkIn.status !== 'EXPIRED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
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
      const { checkIn } = res.locals
      const url = encodeURIComponent(req.url)
      const videoLink = `/case/${crn}/appointments/${id}/check-in/video?back=${url}`
      if (checkIn.status !== 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
      }
      return res.render('pages/check-in/review/identity.njk', { crn, id, back, checkIn, videoLink })
    }
  },

  postReviewIdentityCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const url = encodeURIComponent(req.url)
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/review/notes?back=${url}`)
    }
  },

  getReviewNotesCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { checkIn } = res.locals
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { data } = req.session
      const checkInSession = getDataValue(data, ['esupervision', crn, id, 'checkins'])
      if (checkInSession?.manualIdCheck === undefined) {
        return res.redirect(back ? (back as string) : `/case/${crn}/appointments/${id}/check-in/review/identity`)
      }

      if (checkIn.status !== 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
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
      const url = encodeURIComponent(req.url)
      const { data } = req.session
      const checkIn = getDataValue(data, ['esupervision', crn, id, 'checkins'])
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const pp: ProbationPractitioner = await masClient.getProbationPractitioner(crn)
      const practitionerId = pp?.username ? pp.username : res.locals.user.username
      const review: ESupervisionReview = {
        reviewedBy: practitionerId,
        manualIdCheck: checkIn?.manualIdCheck,
        missedCheckinComment: checkIn?.missedCheckinComment,
        furtherActions: checkIn?.furtherActions,
        riskManagementFeedback: checkIn?.riskManagementFeedback,
      }
      const eSupervisionClient = new ESupervisionClient(token)
      await eSupervisionClient.postOffenderCheckInReview(id, review)
      return res.redirect(`/case/${crn}/activity-log`)
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
        interval: checkinIntervals.find(option => option.id === savedUserDetails?.interval)?.label,
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
        res.json(responseBody)
        logger.info('Check-in registration successful')
      } catch (e) {
        const statusCode = e?.data?.status || 500
        res.status(statusCode).json({ status: 'ERROR', message: e?.data?.userMessage || e?.message || 'Unknown error' })
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
      await postCheckinInComplete(hmppsAuthClient)(req, res)
      const userDetails: CheckinUserDetails = {
        ...savedUserDetails,
        uuid: id,
        interval: checkinIntervals.find(option => option.id === savedUserDetails.interval).label,
        displayCommsOption:
          savedUserDetails.preferredComs === 'EMAIL' ? savedUserDetails.checkInEmail : savedUserDetails.checkInMobile,
        displayDay: dayOfWeek(DateTime.fromFormat(savedUserDetails.date, 'd/M/yyyy').toFormat('yyyy-MM-dd')),
      }
      return res.render('pages/check-in/confirmation.njk', { crn, id, userDetails })
    }
  },

  getCheckinVideoPage: HmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { checkIn } = res.locals
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      return res.render('pages/check-in/video.njk', { crn, id, checkIn, back })
    }
  },
  postTakeAPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { userPhotoUpload } = req.body
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const photoRedirect = `/case/${crn}/appointments/${id}/check-in/photo-rules?photoUpload=${userPhotoUpload}`
      return res.redirect(photoRedirect)
    }
  },
  getManageCheckinPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)
      const mobile = personalDetails.mobileNumber
      const { email } = personalDetails
      return res.render('pages/check-in/manage/manage-checkin.njk', { crn, mobile, email })
    }
  },
}

export const redirectWizard = (url: string): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    let redirectUrl = url
    if (req.query.cya === 'true') {
      redirectUrl = `/case/${crn}/appointments/${id}/check-in/checkin-summary`
      return res.redirect(redirectUrl)
    }
    return next()
  }
}

export default checkInsController
