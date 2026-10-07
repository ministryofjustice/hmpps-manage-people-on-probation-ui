import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getOfficeLocationsByTeamAndProvider,
  getSentences,
  getAppointmentTypes,
  getAppointment,
  getDefaultUser,
  routeChangeAttendee,
  getSmsPreview,
  getSmsConfirmationOptions,
  getSmsConfirmation,
  getPersonRiskFlags,
  getOverdueOutcomes,
  getPersonAppointment,
  handlePostAppointment,
  forceValidation,
  restrictPageAccess,
  getSentenceList,
  checkIsValidUrl,
} from '../middleware'
import {
  getNotePrepend,
  getOutcomeProps,
  getOutcomeSummary,
  getContactOutcomes,
  handlePutOutcome,
  getOutcomeSentence,
  getOutcomeNextAppointment,
} from '../middleware/appointment-outcomes'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { Route } from '../@types'
import controllers from '../controllers'
import { checkAppointments } from '../middleware/checkAppointments'
import { checkAnswers } from '../middleware/checkAnswers'
import { dateIsInPast } from '../utils'
import { getUserOptions } from '../middleware/getUserOptions'
import { returnOptions } from '../middleware/returnOptions'
import { routeChangeSmsConsent } from '../middleware/routeChangeSmsConsent'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient, arnsComponents }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())

  router.get(
    '/case/:crn/arrange-appointment/:id/sentence',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    getSentenceList,
    forceValidation,
    controllers.arrangeAppointments.getSentence(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    getSentenceList,
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.postSentence(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId'] }),
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getDefaultUser(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    forceValidation,
    controllers.arrangeAppointments.getTypeAttendance(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    routeChangeAttendee,
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.postTypeAttendance(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/attendance',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId'] }),
    getUserOptions(hmppsAuthClient),
    controllers.arrangeAppointments.getWhoWillAttend(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.postWhoWillAttend(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance/filter',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    getUserOptions(hmppsAuthClient),
    returnOptions,
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getTimeOptions,
    restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getPersonRiskFlags(hmppsAuthClient),
    forceValidation,
    controllers.arrangeAppointments.getLocationDateTime(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    getTimeOptions,
    routeChangeSmsConsent,
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    checkAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postLocationDateTime(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
    controllers.arrangeAppointments.getLocationNotInList(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
    forceValidation,
    controllers.arrangeAppointments.getSupportingInformation(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    validate.appointments,
    getOutcomeProps,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.postSupportingInformation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess(),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
    getPersonAppointment(hmppsAuthClient),
    getOutcomeProps,
    getOutcomeSentence(hmppsAuthClient),
    getNotePrepend,
    getOutcomeNextAppointment,
    getOutcomeSummary,
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
    checkIsValidUrl,
    getOutcomeProps,
    handlePostAppointment(hmppsAuthClient),
    getOutcomeSentence(hmppsAuthClient),
    getContactOutcomes(hmppsAuthClient),
    getNotePrepend,
    getOutcomeNextAppointment,
    getOutcomeSummary,
    handlePutOutcome(hmppsAuthClient),
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
    getOutcomeProps,
    getContactOutcomes(hmppsAuthClient),
    getOutcomeSentence(hmppsAuthClient),
    getNotePrepend,
    getOutcomeNextAppointment,
    getOutcomeSummary,
    controllers.arrangeAppointments.getArrangeAnotherAppointment(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
    getPersonAppointment(hmppsAuthClient),
    checkIsValidUrl,
    getOutcomeProps,
    handlePostAppointment(hmppsAuthClient),
    getOutcomeSentence(hmppsAuthClient),
    getContactOutcomes(hmppsAuthClient),
    getNotePrepend,
    getOutcomeNextAppointment,
    getOutcomeSummary,
    handlePutOutcome(hmppsAuthClient),
    controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
    getOverdueOutcomes(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/confirmation',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.arrangeAppointments.postConfirmation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/text-message-confirmation',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'start', ['user', 'locationCode']] }),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getSmsPreview(hmppsAuthClient),
    getSmsConfirmationOptions(),
    getSmsConfirmation(hmppsAuthClient),
    controllers.arrangeAppointments.getTextMessageConfirmation(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/text-message-confirmation',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'start', ['user', 'locationCode']] }),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getSmsPreview(hmppsAuthClient),
    getSmsConfirmationOptions(),
    getSmsConfirmation(hmppsAuthClient),
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.postTextMessageConfirmation(hmppsAuthClient),
  )

  router.post('/alert/dismiss', (req, res) => {
    req.session.alertDismissed = true
    return res.json({ success: true })
  })
  router.post('/appointment/is-in-past', (req, res) => {
    const { date, time = '' } = req.body
    const alertDismissed = req?.session?.alertDismissed
    const { isInPast, isToday } = dateIsInPast(date, time)
    return res.json({ isInPast, isToday, alertDismissed })
  })
}

export default arrangeAppointmentRoutes
