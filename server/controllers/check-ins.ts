import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { getDataValue, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails, PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { HmppsAuthClient } from '../data'
import supervisionAppointmentClient from '../../wiremock/stubs/supervisionAppointmentClient'
import { ESupervisionCheckIn } from '../data/model/esupervision'

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
      console.log('HERE')
      const { crn, id } = req.params
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      // const { checkIn } = await esupervision.getCheckin(id) //not available yet
      // checkIn.dueDate = (new Date(checkIn.dueDate), { days: 3 }).toString()
      // if (checkIn.status === 'SUBMITTED') {
      //   checkIn.reviewDueDate = (new Date(checkIn.submittedAt), { days: 3 }).toString()
      // } else if (checkIn.status === 'EXPIRED') {
      //   checkIn.reviewDueDate = (new Date(checkIn.dueDate), { days: 3 }).toString()
      // }
      const checkIn: ESupervisionCheckIn = {
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'REVIEWED',
        dueDate: '2025-11-27',
        offender: {
          uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          firstName: 'string',
          lastName: 'string',
          crn: 'string',
          dateOfBirth: '2025-11-27',
          status: 'INITIAL',
          practitioner: 'string',
          createdAt: '2025-11-27T15:40:42.399Z',
          email: 'string',
          phoneNumber: 'string',
          photoUrl: 'string',
          firstCheckin: '2025-11-27',
          checkinInterval: 'WEEKLY',
        },
        submittedAt: '2025-11-27T15:40:42.399Z',
        surveyResponse: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
        createdBy: 'string',
        createdAt: '2025-11-27T15:40:42.399Z',
        reviewedBy: 'string',
        reviewedAt: '2025-11-27T15:40:42.399Z',
        checkinStartedAt: '2025-11-27T15:40:42.399Z',
        videoUrl: 'string',
        snapshotUrl: 'string',
        autoIdCheck: 'MATCH',
        manualIdCheck: 'MATCH',
        flaggedResponses: ['string'],
      }
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

      const checkIn: ESupervisionCheckIn = {
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'REVIEWED',
        dueDate: '2025-11-27',
        offender: {
          uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          firstName: 'Bob',
          lastName: 'Smith',
          crn: 'string',
          dateOfBirth: '2025-11-27',
          status: 'INITIAL',
          practitioner: 'string',
          createdAt: '2025-11-27T15:40:42.399Z',
          email: 'string',
          phoneNumber: 'string',
          photoUrl: 'string',
          firstCheckin: '2025-11-27',
          checkinInterval: 'WEEKLY',
        },
        submittedAt: '2025-11-27T15:40:42.399Z',
        surveyResponse: {
          mentalHealth: 'well',
          assistance: ['thing1', 'thing2'],
          callback: 'no',
        },
        createdBy: 'string',
        createdAt: '2025-11-27T15:40:42.399Z',
        reviewedBy: 'string',
        reviewedAt: '2025-11-27T15:40:42.399Z',
        checkinStartedAt: '2025-11-27T15:40:42.399Z',
        videoUrl: 'string',
        snapshotUrl: 'string',
        autoIdCheck: 'MATCH',
        manualIdCheck: 'MATCH',
        flaggedResponses: ['string'],
      }
      return res.render('pages/check-in/view.njk', { crn, id, back, checkIn })
    }
  },
}

export default checkInsController
