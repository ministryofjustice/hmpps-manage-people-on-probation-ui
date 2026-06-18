import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import { dateWithYear, dayOfWeek, getDataValue, handleQuotes, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails, PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import {
  CheckinScheduleRequest,
  DeactivateOffenderRequest,
  ESupervisionCheckIn,
  ESupervisionNote,
  ESupervisionReview,
  ReactivateOffenderRequest,
} from '../data/model/esupervision'
import ESupervisionClient from '../data/eSupervisionClient'
import { CheckinUserDetails } from '../models/ESupervision'
import { postCheckInDetails } from '../middleware/postCheckInDetails'
import logger from '../../logger'
import { postCheckinInComplete } from '../middleware/postCheckinComplete'
import { ProbationPractitioner } from '../models/CaseDetail'
import config from '../config'
import { getCheckinOffenderDetails } from '../middleware/getCheckinOffenderDetails'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { parseQuestionTemplate } from '../utils/esupervisionParseTemplate'

function systemIdCheckPass(checkIn: ESupervisionCheckIn): boolean {
  if (checkIn.livenessEnabled) {
    return checkIn.livenessResult === 'LIVE' && checkIn.autoIdCheck === 'MATCH'
  }
  return checkIn.autoIdCheck === 'MATCH'
}

const routes = [
  'getStartSetup',
  'getEligibilityPage',
  'postEligibilityPage',
  'getEligibilityDeniedPage',
  'postEligibilityDeniedPage',
  'getFullEligibilityPage',
  'postFullEligibilityPage',
  'getSupplementaryEligibilityPage',
  'postSupplementaryEligibilityPage',
  'getSPOApprovalPage',
  'postSPOApprovalPage',
  'getRationalePage',
  'postRationalePage',
  'getDateFrequencyPage',
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
  'getViewExpiredCheckIn',
  'getReviewExpiredCheckIn',
  'getReviewIdentityCheckIn',
  'postReviewIdentityCheckIn',
  'getReviewNotesCheckIn',
  'postReviewCheckIn',
  'postPhotoRulesPage',
  'getCheckinSummaryPage',
  'postCheckinSummaryPage',
  'getConfirmationPage',
  'postTakeAPhotoPage',
  'postViewCheckIn',
  'getManageCheckinPage',
  'getManageCheckinDatePage',
  'postManageCheckinDatePage',
  'getManageContactPage',
  'postManageContactPage',
  'getManageEditContactPage',
  'postManageEditContactPage',
  'postManageStopCheckin',
  'getStopCheckinPage',
  'getRestartCheckinPage',
  'postRestartCheckinPage',
  'getRestartContactPage',
  'postRestartContactPage',
  'getRestartEditContactPage',
  'postRestartEditContactPage',
  'getRestartSummaryPage',
  'postRestartSummaryPage',
  'getRestartConfirmation',
  'getStartQuestionsPage',
  'postStartQuestionsPage',
  'getAddQuestionsPage',
  'postAddQuestionsPage',
  'getPreviewFeelingPage',
  'getPreviewSupportPage',
  'getQuestionsListPage',
  'postQuestionsListPage',
  'getEditQuestionPage',
  'postEditQuestionPage',
  'getSelectQuestionPage',
  'getDeleteQuestion',
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
  getStartSetup: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
      const { back } = req.query
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      const id = uuidv4()
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/eligibility-check`)
    }
  },

  getEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_CHECK_IN_ELIGIBILITY', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const practitioner = await masClient.getProbationPractitioner(crn)
      if (practitioner.unallocated) {
        return res.redirect(`/case/${crn}/appointments`)
      }
      const guidanceUrl = config.guidance.link
      return res.render('pages/check-in/eligibility-check.njk', { crn, back, id, guidanceUrl, data: req.session.data })
    }
  },

  postEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const eligibility = req.body?.esupervision?.[crn]?.[id]?.checkins?.eligibility

      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const selections = Array.isArray(eligibility) ? eligibility : [eligibility]

      if (selections.includes('eligibility-9')) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/denied-eligibility`)
      }

      if (selections.includes('eligibility-none')) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/full-eligibility`)
      }

      if (eligibility && eligibility.length > 0) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/supplementary-eligibility`)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/eligibility-check`)
    }
  },

  getEligibilityDeniedPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_NOT_ELIGIBLE_TO_USE_CHECK_IN', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/eligibility-denied.njk', { crn, id, back })
    }
  },

  postEligibilityDeniedPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}`)
    }
  },

  getFullEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_ELIGIBLE_TO_USE_CHECK_IN', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/eligibility-full.njk', { crn, id, back })
    }
  },

  postFullEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'id'], id)
      const eligibilityChoice: string | any[] =
        req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibilityChoice || []

      if (eligibilityChoice === 'REPLACE_F2F') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/spo-approval`)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/rationale`)
    }
  },

  getSupplementaryEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_ELIGIBLE_TO_USE_CHECK_IN_AS_EXISTING_F2F_CONTACT', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/eligibility-supplementary.njk', { crn, id, back })
    }
  },

  postSupplementaryEligibilityPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'id'], id)
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'eligibilityChoice'], 'SUPPLEMENT_F2F')
      const isRationaleEnabled = res.locals.flags?.enableEsupervisionRationale === true
      if (isRationaleEnabled) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/rationale`)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/date-frequency`)
    }
  },

  getSPOApprovalPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query

      await sendAuditMessage(res, 'VIEW_MAS_SPO_APPROVAL_TO_USE_CHECK_INS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)

      const answer = req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibilitySPOApproval
      const isApproved = answer === 'spo-approval' || (Array.isArray(answer) && answer.includes('spo-approval'))

      return res.render('pages/check-in/spo-approval.njk', {
        crn,
        id,
        back,
        isApproved,
      })
    }
  },

  postSPOApprovalPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const approval = req.body?.esupervision?.[crn]?.[id]?.checkins?.eligibilitySPOApproval
      if (approval) {
        setDataValue(data, ['esupervision', crn, id, 'checkins', 'eligibilitySPOApproval'], approval)
      }
      const isRationaleEnabled = res.locals.flags?.enableEsupervisionRationale === true
      if (isRationaleEnabled) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/rationale`)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/date-frequency`)
    }
  },

  getRationalePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (res.locals.flags.enableEsupervisionRationale === false) {
        return res.redirect(`/case/${crn}`)
      }
      const cya = req.query.cya === 'true'
      const eligibility = req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibility || []
      const eligibilityArray = Array.isArray(eligibility) ? eligibility : [eligibility]
      const eligibilityChoice = req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibilityChoice
      let backLink: string
      if (cya) {
        backLink = `/case/${crn}/appointments/${id}/check-in/checkin-summary`
      } else if (eligibilityChoice === 'replacement-contact') {
        backLink = `/case/${crn}/appointments/${id}/check-in/spo-approval`
      } else if (eligibilityArray.includes('eligibility-none')) {
        backLink = `/case/${crn}/appointments/${id}/check-in/full-eligibility`
      } else {
        backLink = `/case/${crn}/appointments/${id}/check-in/supplementary-eligibility`
      }

      await sendAuditMessage(res, 'VIEW_MAS_RATIONALE_TO_USE_CHECK_INS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)

      return res.render('pages/check-in/rationale.njk', {
        crn,
        id,
        backLink,
      })
    }
  },

  postRationalePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/date-frequency`)
    }
  },

  getDateFrequencyPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_SETUP_ONLINE_CHECK_INS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cya = req.query.cya === 'true'
      let backLink: string
      const isRationaleEnabled = res.locals.flags?.enableEsupervisionRationale === true
      if (!isRationaleEnabled) {
        const eligibility = req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibility || []
        const eligibilityArray = Array.isArray(eligibility) ? eligibility : [eligibility]
        const eligibilityChoice = req.session.data?.esupervision?.[crn]?.[id]?.checkins?.eligibilityChoice
        if (cya) {
          backLink = `/case/${crn}/appointments/${id}/check-in/checkin-summary`
        } else if (eligibilityChoice === 'REPLACE_F2F') {
          backLink = `/case/${crn}/appointments/${id}/check-in/spo-approval`
        } else if (eligibilityArray.includes('eligibility-none')) {
          backLink = `/case/${crn}/appointments/${id}/check-in/full-eligibility`
        } else {
          backLink = `/case/${crn}/appointments/${id}/check-in/supplementary-eligibility`
        }
      } else if (cya) {
        backLink = `/case/${crn}/appointments/${id}/check-in/checkin-summary`
      } else {
        backLink = `/case/${crn}/appointments/${id}/check-in/rationale`
      }
      const checkInMinDate = getMinDate()

      return res.render(`pages/check-in/date-frequency.njk`, {
        crn,
        id,
        checkInMinDate,
        cya,
        backLink,
      })
    }
  },

  postDateFrequencyPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/contact-preference`)
    }
  },

  getContactPreferencePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_CONTACT_PREFERENCES', crn, SubjectType.CRN)
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
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cyaQuery = req.query?.cya === 'true' ? '&cya=true' : ''
      const { change } = req.body
      const redirectUrl =
        change === 'main'
          ? `/case/${crn}/appointments/${id}/check-in/photo-options`
          : `/case/${crn}/appointments/${id}/check-in/edit-contact-preference?change=${change}${cyaQuery}`

      return res.redirect(redirectUrl)
    }
  },

  getPhotoOptionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_PHOTO_OPTIONS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/photo-options.njk', { crn, id, cya })
    }
  },
  getEditContactPrePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'EDIT_MAS_CHECK_IN_CONTACT_PREFERENCE', crn, SubjectType.CRN)
      const { change } = req.query
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.render('pages/check-in/edit-contact-preference.njk', { crn, id, change })
    }
  },

  postEditContactPrePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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
        mobileNumber: editCheckInMobile?.trim(),
      }
      let cyaQuery = ''
      if (req.query?.cya === 'true') {
        cyaQuery = '?cya=true'
      }
      const personalDetails: PersonalDetails = await masClient.updatePersonalDetailsContact(crn, body)
      // If personal details overview exists in session cache, update it with latest values
      if (req.session.data?.personalDetails?.[crn]?.overview) {
        req.session.data.personalDetails[crn].overview = personalDetails
      }
      // Save to show the success message on the contact preferences page
      if (personalDetails?.crn) {
        setDataValue(data, ['esupervision', crn, id, 'checkins', 'contactUpdated'], true)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/contact-preference${cyaQuery}`)
    }
  },
  postPhotoOptionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const photoUploadOption = getDataValue(data, ['esupervision', crn, id, 'checkins', 'photoUploadOption'])
      const redirectTo = photoUploadOption === 'TAKE_A_PIC' ? 'take-a-photo' : 'upload-a-photo'
      await sendAuditMessage(res, `VIEW_MAS_CHECK_IN_${redirectTo.toUpperCase()}`, crn, SubjectType.CRN)
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/${redirectTo}`)
    }
  },

  getTakePhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_TAKE_A_PHOTO', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/take-a-photo.njk', { crn, id, cya })
    }
  },

  getUploadPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_UPLOAD_PHOTO', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cya = req.query.cya === 'true'
      return res.render('pages/check-in/upload-a-photo.njk', { crn, id, cya })
    }
  },

  postUploadaPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      return res.redirect(`/case/${crn}/appointments/${id}/check-in/photo-rules`)
    }
  },
  getPhotoRulesPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_PHOTO_RULES', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { photoUpload } = req.query
      return res.render('pages/check-in/photo-rules.njk', { crn, id, photoUpload })
    }
  },

  getUpdateCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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
      if (checkIn.status === 'SUBMITTED' || checkIn.status === 'EXPIRED') {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const practitionerId = res.locals.user.username
        const eSupervisionClient = new ESupervisionClient(token)
        await eSupervisionClient.postOffenderCheckInStarted(id, practitionerId)
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
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query

      const { checkIn } = res.locals

      if (checkIn.status !== 'REVIEWED') {
        return res.render('pages/check-in/update.njk', {
          crn,
          id,
          back,
          checkIn,
          systemIdCheckPass: systemIdCheckPass(checkIn),
        })
      }
      return res.render('pages/check-in/view.njk', {
        crn,
        id,
        back,
        checkIn,
        systemIdCheckPass: systemIdCheckPass(checkIn),
      })
    }
  },

  postViewCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { url } = req

      const { data } = req.session
      const checkIn = getDataValue(data, ['esupervision', crn, id, 'checkins'])

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

      const practitionerUsername = res.locals.user.username

      const eSupervisionClient = new ESupervisionClient(token)
      const notes: ESupervisionNote = {
        updatedBy: practitionerUsername,
        notes: checkIn.note,
        sensitive: checkIn?.sensitiveContact === 'true',
      }
      await eSupervisionClient.postOffenderCheckInNote(id, notes)

      setDataValue(data, ['esupervision', crn, id, 'checkins', 'note'], null)
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'sensitiveContact'], null)
      return res.redirect(url)
    }
  },

  getViewExpiredCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_MISSED_AND_REVIEWED', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { checkIn } = res.locals

      if (checkIn.status !== 'EXPIRED' || !checkIn.reviewedAt) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
      }
      return res.render('pages/check-in/view-expired.njk', { crn, id, back, checkIn })
    }
  },

  getReviewExpiredCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { checkIn } = res.locals
      if (checkIn.status === 'EXPIRED' && checkIn.reviewedAt) {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/view-expired${back ? `?back=${back}` : ''}`)
      }
      if (checkIn.status !== 'EXPIRED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
      }
      await sendAuditMessage(res, 'VIEW_MAS_ONLINE_CHECK_IN_MISSED', crn, SubjectType.CRN)
      return res.render('pages/check-in/review/expired.njk', { crn, id, back, checkIn })
    }
  },

  getReviewIdentityCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { back } = req.query
      const { checkIn } = res.locals
      if (checkIn.status !== 'SUBMITTED') {
        return res.redirect(`/case/${crn}/appointments/${id}/check-in/update${back ? `?back=${back}` : ''}`)
      }
      await sendAuditMessage(res, 'VIEW_MAS_REVIEW_CHECK_IN_AND_CONFIRM_IDENTITY', crn, SubjectType.CRN)
      return res.render('pages/check-in/review/identity.njk', {
        crn,
        id,
        back,
        checkIn,
        systemIdCheckPass: systemIdCheckPass(checkIn),
      })
    }
  },

  postReviewIdentityCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const url = encodeURIComponent(req.url)
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/review/notes?back=${url}`)
    }
  },

  getReviewNotesCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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
      await sendAuditMessage(res, 'VIEW_MAS_ONLINE_CHECK_IN_REVIEW_SUBMITTED', crn, SubjectType.CRN)
      return res.render('pages/check-in/review/notes.njk', { crn, id, back, checkIn })
    }
  },

  postReviewCheckIn: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const url = encodeURIComponent(req.url)
      const { data } = req.session
      const checkIn = getDataValue(data, ['esupervision', crn, id, 'checkins'])
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const practitionerUsername = res.locals.user.username
      let risk: boolean = null
      if (checkIn?.riskManagementFeedback) {
        risk = checkIn.riskManagementFeedback === 'yes'
      }
      const reviewNotes = checkIn?.notes
      const review: ESupervisionReview = {
        reviewedBy: practitionerUsername,
        manualIdCheck: checkIn?.manualIdCheck,
        missedCheckinComment: checkIn?.missedCheckinComment,
        notes: reviewNotes,
        riskManagementFeedback: risk,
        sensitive: checkIn?.sensitiveContact === 'true',
      }
      const eSupervisionClient = new ESupervisionClient(token)
      await eSupervisionClient.postOffenderCheckInReview(id, review)
      setDataValue(data, ['esupervision', crn, id, 'checkins', 'sensitiveContact'], null)
      return res.redirect(`/case/${crn}/activity-log`)
    }
  },
  postPhotoRulesPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/checkin-summary`)
    }
  },
  getCheckinSummaryPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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
      const isRationaleEnabled = res.locals.flags?.enableEsupervisionRationale === true
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_SUMMARY', crn, SubjectType.CRN)
      return res.render('pages/check-in/checkin-summary.njk', { crn, id, userDetails, isRationaleEnabled })
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
      const { crn, id } = req.params as Record<string, string>
      const savedUserDetails = req.session.data?.esupervision?.[crn]?.[id]?.checkins
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      await postCheckinInComplete(hmppsAuthClient)(req, res)
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      const activeId = res.locals?.offenderCheckinsByCRNResponse?.uuid
      const userDetails: CheckinUserDetails = {
        ...savedUserDetails,
        uuid: activeId,
        interval: checkinIntervals.find(option => option.id === savedUserDetails.interval).label,
        displayCommsOption:
          savedUserDetails.preferredComs === 'EMAIL' ? savedUserDetails.checkInEmail : savedUserDetails.checkInMobile,
        displayDay: dayOfWeek(DateTime.fromFormat(savedUserDetails.date, 'd/M/yyyy').toFormat('yyyy-MM-dd')),
      }
      const today = DateTime.now().startOf('day')
      const checkInDate = DateTime.fromFormat(userDetails.date, 'd/M/yyyy').startOf('day')
      const isFutureCheckinDate = checkInDate > today

      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_CONFIRMATION', crn, SubjectType.CRN)
      return res.render('pages/check-in/confirmation.njk', { crn, id, activeId, userDetails, isFutureCheckinDate })
    }
  },

  postTakeAPhotoPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_CHECK_IN', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)
      const mobile = personalDetails.mobileNumber
      const { email } = personalDetails
      const { data } = req.session
      // if page not submitted, required to save in session for change link  to avoid API call.
      setDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'checkInMobile'], mobile)
      setDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'checkInEmail'], email)
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      const checkinRes = res.locals?.offenderCheckinsByCRNResponse
      const eSupClient = new ESupervisionClient(token)
      let upcomingCheckin = null
      try {
        const response = await eSupClient.getUpcomingCheckinQuestions(crn)
        upcomingCheckin = response || null
      } catch (error) {
        logger.info(`No upcoming check in questions found for CRN ${crn}`)
      }
      // questions can be edited until 23:59 the day before a check in is sent out
      const today = new Date().setHours(0, 0, 0, 0)
      const checkinDate = upcomingCheckin?.expectedCheckinDate
        ? new Date(upcomingCheckin.expectedCheckinDate).setHours(0, 0, 0, 0)
        : null
      const canEditQuestions = checkinDate ? today < checkinDate : false
      const showChange = checkinRes?.status === 'VERIFIED'
      setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'preferredComs'], undefined)
      const settingsUpdated = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'settingsUpdated'])
      if (settingsUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.manageCheckin?.settingsUpdated
      }
      const questionsAdded = getDataValue(req.session.data, ['esupervision', crn, id, 'questionsAdded'])

      let successMessageHtml: string | undefined

      if (questionsAdded) {
        res.locals.success = true
        const forename = personalDetails?.name?.forename || 'the person'
        const rawCheckinDate = upcomingCheckin?.expectedCheckinDate
        const nextCheckinDate = dateWithYear(rawCheckinDate)
        successMessageHtml = `
          <strong>You have added additional questions to ${forename}’s next online check in</strong>
          <br>
          Additional questions will only apply to their next check in${nextCheckinDate ? ` on ${nextCheckinDate}` : ''}
        `
        setDataValue(req.session.data, ['esupervision', crn, id, 'questionsAdded'], undefined)
      }
      return res.render('pages/check-in/manage/manage-checkin.njk', {
        crn,
        id,
        mobile,
        email,
        showChange,
        upcomingCheckin,
        canEditQuestions,
        successMessageHtml,
      })
    }
  },
  getManageCheckinDatePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_CHECK_IN_SETTINGS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const checkInMinDate = getMinDate()
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      const checkinRes = res.locals?.offenderCheckinsByCRNResponse
      const date = checkinRes?.firstCheckin
      const interval = checkinRes?.checkinInterval
      setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin'], { date, interval })
      return res.render('pages/check-in/manage/checkin-settings.njk', {
        crn,
        id,
        checkInMinDate,
        date,
        interval,
      })
    }
  },
  postManageCheckinDatePage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const previousDate = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'date'])
      const previousInterval = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'interval'])
      // firstCheckinDate is provided in format dd/M/yyyy. Convert to yyyy/M/dd as required by API.
      const parsedFirstCheckin = DateTime.fromFormat(previousDate ?? '', 'd/M/yyyy')
      const formattedDate = parsedFirstCheckin.isValid ? parsedFirstCheckin.toFormat('yyyy/M/dd') : previousDate
      const body: CheckinScheduleRequest = {
        checkinSchedule: {
          requestedBy: res.locals.user.username,
          firstCheckin: formattedDate,
          checkinInterval: previousInterval,
        },
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupClient = new ESupervisionClient(token)
      const response = await eSupClient.postUpdateOffenderDetails(id, body)
      if (response?.crn) {
        res.locals.success = true
        setDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'settingsUpdated'], true)
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
    }
  },
  getManageContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_CHECK_IN_CONTACT', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const checkInMobile = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'checkInMobile'])
      const checkInEmail = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'checkInEmail'])

      // To show success message on edit contact preference page
      const contactUpdated = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'contactUpdated'])
      if (contactUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.manageCheckin?.contactUpdated
      }
      const isPrefComsSet = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'preferredComs'])
      if (isPrefComsSet === undefined) {
        await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
        setDataValue(
          data,
          ['esupervision', crn, id, 'manageCheckin', 'preferredComs'],
          res.locals?.offenderCheckinsByCRNResponse?.contactPreference,
        )
      }

      return res.render('pages/check-in/manage/manage-contact.njk', { crn, id, checkInMobile, checkInEmail })
    }
  },
  postManageContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { change } = req.body
      const { data } = req.session
      const checkInMobile = getDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'checkInMobile'])
      const checkInEmail = getDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'checkInEmail'])
      setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'editCheckInMobile'], checkInMobile)
      setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'editCheckInEmail'], checkInEmail)
      let redirectUrl = `/case/${crn}/appointments/check-in/manage/${id}/edit-contact?change=${change}`
      if (change === 'main') {
        const body: CheckinScheduleRequest = {
          contactPreference: {
            requestedBy: res.locals.user.username,
            contactPreference: getDataValue(req.session.data, [
              'esupervision',
              crn,
              id,
              'manageCheckin',
              'preferredComs',
            ]),
          },
        }
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const eSupClient = new ESupervisionClient(token)
        const response = await eSupClient.postUpdateOffenderDetails(id, body)
        if (response?.crn) {
          res.locals.success = true
          setDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'settingsUpdated'], true)
        }
        redirectUrl = `/case/${crn}/appointments/check-in/manage/${id}`
        setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'preferredComs'], undefined)
      }
      return res.redirect(redirectUrl)
    }
  },
  getManageEditContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'EDIT_MAS_MANAGE_CHECK_IN_CONTACT', crn, SubjectType.CRN)
      const { change } = req.query
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      // To show success message on edit contact preference page
      const contactUpdated = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'manageCheckin',
        'contactUpdated',
      ])
      if (contactUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.manageCheckin?.contactUpdated
      }
      const checkInMobile = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'manageCheckin',
        'editCheckInMobile',
      ])
      const checkInEmail = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'manageCheckin',
        'editCheckInEmail',
      ])
      return res.render('pages/check-in/manage/manage-edit-contact.njk', {
        crn,
        id,
        change,
        checkInMobile,
        checkInEmail,
      })
    }
  },
  postManageEditContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const { previousMobile, previousEmail } = req.body

      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const editCheckInEmail1 = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'editCheckInEmail'])
      const editCheckInMobile1 = getDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'editCheckInMobile'])
      if (previousMobile?.trim() !== editCheckInMobile1?.trim() || previousEmail !== editCheckInEmail1) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)

        const body: PersonalDetailsUpdateRequest = {
          emailAddress: editCheckInEmail1,
          mobileNumber: editCheckInMobile1?.trim(),
        }
        const personalDetails: PersonalDetails = await masClient.updatePersonalDetailsContact(crn, body)
        // If personal details overview exists in session cache, update it with latest values
        if (req.session.data?.personalDetails?.[crn]?.overview) {
          req.session.data.personalDetails[crn].overview = personalDetails
        }
        // Save to show success message on contact preferences page
        if (personalDetails?.crn) {
          setDataValue(data, ['esupervision', crn, id, 'manageCheckin', 'contactUpdated'], true)
          setDataValue(
            req.session.data,
            ['esupervision', crn, id, 'manageCheckin', 'checkInMobile'],
            editCheckInMobile1?.trim(),
          )
          setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'checkInEmail'], editCheckInEmail1)
        }
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/contact`)
    }
  },
  getStopCheckinPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_STOP_CHECK_IN', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/manage/stop-checkin.njk', { crn, id })
    }
  },

  getRestartCheckinPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      const { data } = req.session
      const cya = req.query.cya === 'true'
      const checkInMinDate = getMinDate()

      const defaultsLoaded = getDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'id'])
      if (!defaultsLoaded) {
        await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
        const offenderSettings = res.locals.offenderCheckinsByCRNResponse

        setDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'id'], id)
        setDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'interval'], offenderSettings.checkinInterval)
        setDataValue(
          data,
          ['esupervision', crn, id, 'restartCheckin', 'preferredComs'],
          offenderSettings.contactPreference,
        )
      }

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_WHEN_TO_COMPLETE_ONLINE_CHECK_IN', crn, SubjectType.CRN)
      return res.render('pages/check-in/manage/restart-date-frequency.njk', {
        crn,
        id,
        checkInMinDate,
        case: personalDetails,
        cya,
      })
    }
  },

  postRestartCheckinPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const cyaQuery = req.query?.cya === 'true' ? '?cya=true' : ''
      if (req.query?.cya === 'true') {
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/restart-summary${cyaQuery}`)
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/restart-contact`)
    }
  },

  getRestartContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
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

      const preferredComs = getDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'preferredComs'])
      // if page not submitted, required to save in session for change link /edit page to avoid API call.
      setDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'editCheckInMobile'], checkInMobile)
      setDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'editCheckInEmail'], checkInEmail)

      // To show success message on edit contact preference page
      const contactUpdated = getDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'contactUpdated'])
      if (contactUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.restartCheckin?.contactUpdated
      }
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_RESTART_ONLINE_CHECK_IN', crn, SubjectType.CRN)
      return res.render('pages/check-in/manage/restart-contact-preference.njk', {
        crn,
        id,
        checkInMobile,
        checkInEmail,
        preferredComs,
        case: personalDetails,
        cya,
      })
    }
  },

  postRestartContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.body
      const url =
        change === 'main'
          ? `/case/${crn}/appointments/check-in/manage/${id}/restart-summary`
          : `/case/${crn}/appointments/check-in/manage/${id}/restart-edit-contact?change=${change}`
      return res.redirect(url)
    }
  },

  getRestartEditContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { change } = req.query
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      // To show success message on edit contact preference page
      const contactUpdated = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'restartCheckin',
        'contactUpdated',
      ])
      if (contactUpdated) {
        res.locals.success = true
        delete req.session?.data?.esupervision?.[crn]?.[id]?.restartCheckin?.contactUpdated
      }
      const checkInMobile = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'restartCheckin',
        'editCheckInMobile',
      ])
      const checkInEmail = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'restartCheckin',
        'editCheckInEmail',
      ])
      await sendAuditMessage(res, 'EDIT_MAS_MANAGE_RESTART_ONLINE_CHECK_IN', crn, SubjectType.CRN)
      return res.render('pages/check-in/manage/restart-edit-contact.njk', {
        crn,
        id,
        change,
        checkInMobile,
        checkInEmail,
      })
    }
  },

  postRestartEditContactPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const { previousMobile, previousEmail } = req.body

      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const editCheckInEmail = getDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'editCheckInEmail'])
      const editCheckInMobile = getDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'editCheckInMobile'])
      if (previousMobile?.trim() !== editCheckInMobile?.trim() || previousEmail !== editCheckInEmail) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)

        const body: PersonalDetailsUpdateRequest = {
          emailAddress: editCheckInEmail,
          mobileNumber: editCheckInMobile?.trim(),
        }
        const personalDetails: PersonalDetails = await masClient.updatePersonalDetailsContact(crn, body)
        // If personal details overview exists in session cache, update it with latest values
        if (req.session.data?.personalDetails?.[crn]?.overview) {
          req.session.data.personalDetails[crn].overview = personalDetails
        }
        // Save to show success message on contact preferences page
        if (personalDetails?.crn) {
          setDataValue(data, ['esupervision', crn, id, 'restartCheckin', 'contactUpdated'], true)
          setDataValue(
            req.session.data,
            ['esupervision', crn, id, 'restartCheckin', 'editCheckInMobile'],
            editCheckInMobile?.trim(),
          )
          setDataValue(
            req.session.data,
            ['esupervision', crn, id, 'restartCheckin', 'editCheckInEmail'],
            editCheckInEmail,
          )
        }
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/restart-contact`)
    }
  },

  getRestartSummaryPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session
      const restartDetails = getDataValue(data, ['esupervision', crn, id, 'restartCheckin'])
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const caseData = await masClient.getPersonalDetails(crn)

      const userDetails = {
        ...restartDetails,
        interval: checkinIntervals.find(i => i.id === restartDetails.interval)?.label,
        preferredComs: restartDetails.preferredComs === 'EMAIL' ? 'Email' : 'Text message',
        checkInMobile: restartDetails.checkInMobile || caseData.mobileNumber || 'No mobile number',
        checkInEmail: restartDetails.checkInEmail || caseData.email || 'No email address',
      }
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_RESTART_ONLINE_CHECK_IN_SUMMARY', crn, SubjectType.CRN)
      return res.render('pages/check-in/manage/restart-checkin-summary.njk', {
        crn,
        id,
        userDetails,
        case: caseData,
      })
    }
  },

  postRestartSummaryPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session

      const restartDetails = getDataValue(data, ['esupervision', crn, id, 'restartCheckin'])
      if (!restartDetails) return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/restart-checkin`)

      try {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const eSupervisionClient = new ESupervisionClient(token)

        const parsedDate = DateTime.fromFormat(restartDetails.date ?? '', 'd/M/yyyy')
        const formattedDate = parsedDate.isValid ? parsedDate.toISODate() : restartDetails.date

        const body: ReactivateOffenderRequest = {
          requestedBy: res.locals.user.username,
          reason: restartDetails.reason || 'Reactivated via MPOP UI',
          checkinSchedule: {
            requestedBy: res.locals.user.username,
            firstCheckin: formattedDate,
            checkinInterval: restartDetails.interval,
          },
          contactPreference: {
            requestedBy: res.locals.user.username,
            contactPreference: restartDetails.preferredComs,
          },
        }

        await eSupervisionClient.postReactivateOffender(id, body)

        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/restart-confirmation`)
      } catch (e) {
        logger.error(`Reactivate failed: ${e.message}`)
        return renderError(500)(req, res)
      }
    }
  },

  getRestartConfirmation: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { data } = req.session

      const savedDetails = getDataValue(data, ['esupervision', crn, id, 'restartCheckin'])

      if (!savedDetails) {
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
      }

      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const caseData = await masClient.getPersonalDetails(crn)

      const userDetails = {
        ...savedDetails,
        interval: checkinIntervals.find(option => option.id === savedDetails.interval)?.label,
        displayCommsOption:
          savedDetails.preferredComs === 'EMAIL' ? savedDetails.checkInEmail : savedDetails.checkInMobile,
        displayDay: dayOfWeek(DateTime.fromFormat(savedDetails.date, 'd/M/yyyy').toFormat('yyyy-MM-dd')),
      }
      setDataValue(data, ['esupervision', crn, id, 'restartCheckin'], undefined)
      await sendAuditMessage(res, 'VIEW_MAS_MANAGE_RESTART_ONLINE_CHECK_IN_CONFIRMATION', crn, SubjectType.CRN)
      return res.render('pages/check-in/manage/restart-confirmation.njk', {
        crn,
        id,
        case: caseData,
        userDetails,
      })
    }
  },

  postManageStopCheckin: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }

      const reasonData = getDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin', 'stopCheckinReason'])

      let isSensitive = false
      const sensitiveData = getDataValue(req.session.data, [
        'esupervision',
        crn,
        id,
        'manageCheckin',
        'stopCheckinSensitive',
      ])
      isSensitive = sensitiveData === 'true'

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)

      const body: DeactivateOffenderRequest = {
        requestedBy: res.locals.user.username,
        reason: handleQuotes(reasonData),
        sensitive: isSensitive,
      }
      res.locals.offenderCheckinsByCRNResponse = await eSupervisionClient.postDeactivateOffender(id, body)
      setDataValue(req.session.data, ['esupervision', crn, id, 'manageCheckin'], null)
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
    }
  },

  // manage check in questions

  getStartQuestionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_ADD_CHECK_IN_QUESTIONS_START', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/questions/instructions.njk', { crn, back, id, data: req.session.data })
    }
  },

  postStartQuestionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
    }
  },

  getAddQuestionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)
      await sendAuditMessage(res, 'VIEW_MAS_CHECK_IN_ADD_QUESTIONS', crn, SubjectType.CRN)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)

      const { data } = req.session

      let availableTemplates =
        getDataValue(data, ['esupervision', crn, id, 'manageQuestions', 'availableTemplates']) || []
      if (availableTemplates.length === 0) {
        const eSupClient = new ESupervisionClient(token)
        const templatesList = await eSupClient.getQuestionsTemplates('en-GB')
        const customisableTemplates = templatesList.templates.filter(
          (t: any) => t.policy$hmpps_esupervision_api === 'CUSTOMISABLE',
        )
        availableTemplates = customisableTemplates
        setDataValue(data, ['esupervision', crn, id, 'manageQuestions', 'availableTemplates'], availableTemplates)
      }

      let questionTemplateAndInputs = getDataValue(data, [
        'esupervision',
        crn,
        id,
        'manageQuestions',
        'questionTemplateAndInputs',
      ])
      let expectedCheckinDate = getDataValue(data, ['esupervision', crn, id, 'manageQuestions', 'expectedCheckinDate'])
      // Fetch current check in questions if they have already been submitted
      if (!questionTemplateAndInputs) {
        questionTemplateAndInputs = {}
        try {
          const eSupClient = new ESupervisionClient(token)
          const response = await eSupClient.getUpcomingCheckinQuestionItems(crn, 'en-GB')
          expectedCheckinDate = response?.upcoming?.expectedCheckinDate
          const items = response?.upcoming?.items || []

          items.forEach((item: any) => {
            const isCustomisable = availableTemplates.some((t: any) => String(t.id) === String(item.template.id))
            if (isCustomisable) {
              const draftId = `${item.template.id}-${uuidv4()}`
              const inputValue = Object.values(item.params?.placeholders || {})[0] || ''
              questionTemplateAndInputs[draftId] = inputValue
            }
          })
        } catch (error: any) {
          if (error?.status === 404 || error?.response?.status === 404) {
            logger.info(`No upcoming questions found for CRN ${crn}.`)
          } else {
            logger.error(`Failed to fetch upcoming questions for CRN ${crn}:`, error)
            return renderError(error?.status || 500)(req, res)
          }
        }
        setDataValue(
          data,
          ['esupervision', crn, id, 'manageQuestions', 'questionTemplateAndInputs'],
          questionTemplateAndInputs,
        )
        setDataValue(data, ['esupervision', crn, id, 'manageQuestions', 'expectedCheckinDate'], expectedCheckinDate)
      }

      const addedQuestions = Object.entries(questionTemplateAndInputs)
        .map(([qId, inputValue]) => {
          if (!inputValue || typeof inputValue !== 'string' || inputValue.trim() === '') return null
          const templateId = parseInt(qId.split('-')[0], 10)

          const templateData = parseQuestionTemplate(availableTemplates, templateId)

          if (!templateData) return null

          return {
            id: qId,
            fullText: `${templateData.prefix} ${inputValue}${templateData.suffix}`.trim(),
          }
        })
        .filter(q => q !== null)

      return res.render('pages/check-in/questions/add-questions.njk', {
        crn,
        id,
        back,
        case: personalDetails,
        addedQuestions,
        data,
        expectedCheckinDate,
      })
    }
  },

  postAddQuestionsPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)

      const manageQuestionsSession = getDataValue(req.session.data, ['esupervision', crn, id, 'manageQuestions']) || {}
      const questionTemplateAndInputs = manageQuestionsSession.questionTemplateAndInputs || {}
      const availableTemplates = manageQuestionsSession.availableTemplates || []
      const formattedQuestions = Object.entries(questionTemplateAndInputs).map(([draftId, inputValue]) => {
        const templateId = parseInt(draftId.split('-')[0], 10)
        const originalTemplate = availableTemplates.find((t: any) => String(t.id) === String(templateId))

        return {
          id: templateId,
          params: {
            placeholders: {
              [originalTemplate?.responseSpec?.placeholders?.[0] || 'text']: inputValue as string,
            },
            responseFormat: originalTemplate?.responseFormat || 'TEXT',
          },
        }
      })

      try {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const eSupClient = new ESupervisionClient(token)

        if (formattedQuestions.length === 0) {
          await eSupClient.deleteAssignedQuestionsFromCheckIn(crn)
          setDataValue(req.session.data, ['esupervision', crn, id, 'questionsAdded'], false)
        } else {
          await eSupClient.putAssignQuestionsToCheckIn(crn, {
            questions: formattedQuestions,
            language: 'en-GB',
            author: res.locals.user.username,
          })
          setDataValue(req.session.data, ['esupervision', crn, id, 'questionsAdded'], true)
        }

        setDataValue(req.session.data, ['esupervision', crn, id, 'manageQuestions'], undefined)
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
      } catch (error: any) {
        logger.error(`Failed to assign/delete questions for CRN ${crn}:`, error)
        return renderError(error?.status || 500)(req, res)
      }
    }
  },

  getPreviewFeelingPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_PREVIEW_FEELING_CHECK_IN_QUESTIONS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/questions/preview/feeling.njk', {
        crn,
        back,
        id,
        data: req.session.data,
      })
    }
  },
  getPreviewSupportPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_PREVIEW_SUPPORT_CHECK_IN_QUESTIONS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/questions/preview/support.njk', {
        crn,
        back,
        id,
        data: req.session.data,
      })
    }
  },

  getQuestionsListPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      await sendAuditMessage(res, 'VIEW_MAS_LIST_CHECK_IN_LIST_QUESTIONS', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const eSupClient = new ESupervisionClient(token)

      const personalDetails = await masClient.getPersonalDetails(crn)
      const templatesList = await eSupClient.getQuestionsTemplates('en-GB')
      const customisableTemplates = templatesList.templates.filter(
        (t: any) => t.policy$hmpps_esupervision_api === 'CUSTOMISABLE',
      )
      const availableTemplates = customisableTemplates

      setDataValue(
        req.session.data,
        ['esupervision', crn, id, 'manageQuestions', 'availableTemplates'],
        availableTemplates,
      )
      // redirect if questions >= 3
      const questionTemplateAndInputs =
        getDataValue(req.session.data, ['esupervision', crn, id, 'manageQuestions', 'questionTemplateAndInputs']) || {}
      if (Object.keys(questionTemplateAndInputs).length >= 3) {
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
      }
      // replace curly braces placeholder with [insert text] for presentation
      const displayTemplates = templatesList.templates.map((q: any) => {
        const start = q.template.indexOf('{{')
        const end = q.template.indexOf('}}', start)

        let displayTemplate = q.template
        if (start !== -1 && end !== -1) {
          displayTemplate = `${q.template.substring(0, start)}[insert text]${q.template.substring(end + 2)}`
        }

        return {
          ...q,
          displayTemplate,
        }
      })
      return res.render('pages/check-in/questions/list-questions.njk', {
        crn,
        id,
        back,
        case: personalDetails,
        templatesList: { templates: displayTemplates },
        data: req.session.data,
      })
    }
  },

  postQuestionsListPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
    }
  },

  getEditQuestionPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, questionId } = req.params as Record<string, string>
      const { back } = req.query
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)
      await sendAuditMessage(res, 'VIEW_MAS_ADD_CHECK_IN_QUESTIONS_EDIT', crn, SubjectType.CRN)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personalDetails = await masClient.getPersonalDetails(crn)

      let availableTemplates =
        getDataValue(req.session.data, ['esupervision', crn, id, 'manageQuestions', 'availableTemplates']) || []

      if (availableTemplates.length === 0) {
        const eSupClient = new ESupervisionClient(token)
        const templatesList = await eSupClient.getQuestionsTemplates('en-GB')
        const customisableTemplates = templatesList.templates.filter(
          (t: any) => t.policy$hmpps_esupervision_api === 'CUSTOMISABLE',
        )
        availableTemplates = customisableTemplates
        setDataValue(
          req.session.data,
          ['esupervision', crn, id, 'manageQuestions', 'availableTemplates'],
          availableTemplates,
        )
      }

      const templateId = questionId.split('-')[0]
      const questionForView = parseQuestionTemplate(availableTemplates, templateId)

      if (!questionForView) return renderError(404)(req, res)

      return res.render('pages/check-in/questions/edit-question.njk', {
        crn,
        id,
        questionId,
        back,
        case: personalDetails,
        question: questionForView,
        data: req.session.data,
      })
    }
  },

  postEditQuestionPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, questionId } = req.params as Record<string, string>
      const { data } = req.session

      const inputValue = req.body?.esupervision?.[crn]?.[id]?.manageQuestions?.draftQuestionInput

      if (inputValue && inputValue.trim() !== '') {
        setDataValue(
          data,
          ['esupervision', crn, id, 'manageQuestions', 'questionTemplateAndInputs', questionId],
          inputValue.trim(),
        )

        if (data.esupervision?.[crn]?.[id]?.manageQuestions?.draftQuestionInput !== undefined) {
          delete data.esupervision[crn][id].manageQuestions.draftQuestionInput
        }
      }

      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
    }
  },

  getSelectQuestionPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, templateId } = req.params as Record<string, string>
      await sendAuditMessage(res, 'VIEW_MAS_ADD_CHECK_IN_QUESTIONS_SELECT', crn, SubjectType.CRN)
      if (!isValidCrn(crn) || !isValidUUID(id)) return renderError(404)(req, res)

      const questionTemplateAndInputs =
        getDataValue(req.session.data, ['esupervision', crn, id, 'manageQuestions', 'questionTemplateAndInputs']) || {}
      if (Object.keys(questionTemplateAndInputs).length >= 3) {
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
      }
      const draftId = `${templateId}-${uuidv4()}`
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/${draftId}/edit`)
    }
  },

  getDeleteQuestion: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, questionId } = req.params as Record<string, string>
      const { data } = req.session
      await sendAuditMessage(res, 'VIEW_MAS_ADD_CHECK_IN_QUESTIONS_DELETE', crn, SubjectType.CRN)
      if (data.esupervision?.[crn]?.[id]?.manageQuestions?.questionTemplateAndInputs?.[questionId]) {
        delete data.esupervision[crn][id].manageQuestions.questionTemplateAndInputs[questionId]
      }

      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}/questions/add`)
    }
  },
}

export const getMinDate = (): string => {
  const today = new Date()
  // setting temporary fix for minDate
  // (https://github.com/ministryofjustice/moj-frontend/issues/923)
  let checkInMinDate: string
  if (today.getDate() > 9) {
    checkInMinDate = DateTime.fromJSDate(today).toFormat('dd/M/yyyy')
  } else {
    checkInMinDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
  }

  return checkInMinDate
}

export default checkInsController
