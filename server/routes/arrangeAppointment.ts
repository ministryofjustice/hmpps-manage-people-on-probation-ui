import { type Router } from 'express'
import {
  autoStoreSessionData,
  getOfficeLocationsByTeamAndProvider,
  getSentences,
  getAppointmentTypes,
  getAppointment,
  getDefaultUser,
  getUserOptions,
  routeChangeAttendee,
  getSmsPreview,
  getOverdueOutcomes,
  getPersonAppointment,
  handlePostAppointment,
  forceValidation,
  restrictPageAccess,
  getPersonalDetails,
  getPersonRiskFlags,
} from '../middleware'
import {
  getNotePrepend,
  getOutcomeProps,
  getOutcomeSummary,
  getContactOutcomes,
  handlePutOutcome,
  getOutcomeSentence,
} from '../middleware/appointment-outcomes'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { getTimeOptions } from '../middleware/getTimeOptions'
import controllers from '../controllers'
import { checkAppointments } from '../middleware/checkAppointments'
import { checkAnswers } from '../middleware/checkAnswers'
import { getSmsConfirmationOptions } from '../middleware/getSmsConfirmationOptions'
import { dismissAlert } from '../middleware/dismissAlert'
import { checkIsInPast } from '../middleware/isInPast'
import { dateIsInPast } from '../utils'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient, flagService, arnsComponents }: Services) => {
  if ((await flagService?.getFlags({}))?.enableAppointmentsSpeedup === true) {
    router.get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())

    router.get(
      '/case/:crn/arrange-appointment/:id/sentence',
      getAppointmentTypes(hmppsAuthClient),
      getSentences(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      forceValidation,
      controllers.arrangeAppointments.getSentence(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/sentence',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getSentences(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postSentence(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/type-attendance',
      restrictPageAccess({ requiredValues: ['eventId'] }),
      getAppointmentTypes(hmppsAuthClient),
      getDefaultUser(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      forceValidation,
      controllers.arrangeAppointments.getTypeAttendance(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/type-attendance',
      routeChangeAttendee,
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postTypeAttendance(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/attendance',
      restrictPageAccess({ requiredValues: ['eventId'] }),
      getAppointmentTypes(hmppsAuthClient),
      getUserOptions(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      controllers.arrangeAppointments.getWhoWillAttend(),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/attendance',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postWhoWillAttend(hmppsAuthClient),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/location-date-time',
      restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
      getAppointmentTypes(hmppsAuthClient),
      getTimeOptions,
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      forceValidation,
      controllers.arrangeAppointments.getLocationDateTime(hmppsAuthClient),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/location-date-time',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getTimeOptions,
      getAppointment(hmppsAuthClient),
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      checkAppointments(hmppsAuthClient),
      controllers.arrangeAppointments.postLocationDateTime(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/location-not-in-list',
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
      controllers.arrangeAppointments.getLocationNotInList(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/attended-complied',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date'] }),
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOutcomeProps,
      controllers.arrangeAppointments.getAttendedComplied(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/attended-complied',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOutcomeProps,
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postAttendedComplied(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/supporting-information',
      restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      forceValidation,
      controllers.arrangeAppointments.getSupportingInformation(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/supporting-information',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postSupportingInformation(),
    )

    // WHAT IS THIS ROUTE?
    router.get(
      '/case/:crn/appointments/appointment/:contactId/check-your-answers',
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
      getPersonAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      controllers.arrangeAppointments.getCheckYourAnswers(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/check-your-answers',
      restrictPageAccess(),
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
      getPersonAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      controllers.arrangeAppointments.getCheckYourAnswers(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
      getOutcomeProps,
      getContactOutcomes(hmppsAuthClient),
      getOutcomeSentence(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      controllers.arrangeAppointments.getArrangeAnotherAppointment(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/check-your-answers',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
      getPersonAppointment(hmppsAuthClient),
      handlePostAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getContactOutcomes(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      handlePutOutcome(hmppsAuthClient),
      controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
      getPersonAppointment(hmppsAuthClient),
      handlePostAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getContactOutcomes(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      handlePutOutcome(hmppsAuthClient),
      controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/confirmation',
      restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOverdueOutcomes(hmppsAuthClient),
      controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/confirmation',
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      controllers.arrangeAppointments.postConfirmation(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/text-message-confirmation',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'start', ['user', 'locationCode']] }),
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getSmsPreview(hmppsAuthClient),
      getSmsConfirmationOptions,
      controllers.arrangeAppointments.getTextMessageConfirmation(hmppsAuthClient),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/text-message-confirmation',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getSmsPreview(hmppsAuthClient),
      getSmsConfirmationOptions,
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postTextMessageConfirmation(hmppsAuthClient),
    )

    /* Delete these routes after enableNonCompliance feature flag is removed 👇 */

    router.get(
      '/case/:crn/arrange-appointment/:id/add-note',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'outcomeRecorded'] }),
      getAppointmentTypes(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOutcomeProps,
      forceValidation,
      controllers.arrangeAppointments.getAddNote(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/add-note',
      getAppointmentTypes(hmppsAuthClient),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      getOutcomeProps,
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      controllers.arrangeAppointments.postAddNote(),
    )

    /* ----------------- 👆 -----------------  */

    router.post('/alert/dismiss', dismissAlert)

    router.post('/appointment/is-in-past', checkIsInPast)
  } else {
    router.all(
      '/case/:crn/arrange-appointment/:id/*path',
      getAppointmentTypes(hmppsAuthClient),
      getPersonalDetails(hmppsAuthClient, arnsComponents),
      getAppointment(hmppsAuthClient),
    )
    router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))
    router.get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())
    router.get(
      '/case/:crn/arrange-appointment/:id/sentence',
      forceValidation,
      controllers.arrangeAppointments.getSentence(),
    )

    router.post('/case/:crn/arrange-appointment/:id/*path', [
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
    ])

    router.post(
      '/case/:crn/arrange-appointment/:id/sentence',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postSentence(),
    )
    router.get(
      '/case/:crn/arrange-appointment/:id/type-attendance',
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
      routeChangeAttendee,
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postTypeAttendance(),
    )
    router.get(
      '/case/:crn/arrange-appointment/:id/attendance',
      restrictPageAccess({ requiredValues: ['eventId'] }),
      getUserOptions(hmppsAuthClient),
      controllers.arrangeAppointments.getWhoWillAttend(),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/attendance',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postWhoWillAttend(hmppsAuthClient),
    )

    router.all('/case/:crn/arrange-appointment/:id/location-date-time', getTimeOptions)
    router.get(
      '/case/:crn/arrange-appointment/:id/location-date-time',
      restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getPersonRiskFlags(hmppsAuthClient),
      forceValidation,
      controllers.arrangeAppointments.getLocationDateTime(hmppsAuthClient),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/location-date-time',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      checkAppointments(hmppsAuthClient),
      controllers.arrangeAppointments.postLocationDateTime(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/location-not-in-list',
      restrictPageAccess({ requiredValues: ['eventId', 'type'] }),
      controllers.arrangeAppointments.getLocationNotInList(),
    )

    router.all(['/case/:crn/arrange-appointment/:id/attended-complied'], getOutcomeProps)

    router.get(
      '/case/:crn/arrange-appointment/:id/attended-complied',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date'] }),
      controllers.arrangeAppointments.getAttendedComplied(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/attended-complied',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postAttendedComplied(),
    )

    router.get(
      '/case/:crn/arrange-appointment/:id/supporting-information',
      restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
      forceValidation,
      controllers.arrangeAppointments.getSupportingInformation(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/supporting-information',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      checkAnswers,
      controllers.arrangeAppointments.postSupportingInformation(),
    )

    router.get('/case/:crn/arrange-appointment/:id/check-your-answers', restrictPageAccess())

    router.all(
      [
        '/case/:crn/arrange-appointment/:id/check-your-answers',
        '/case/:crn/appointments/appointment/:contactId/check-your-answers',
        '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      ],
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
      getAppointment(hmppsAuthClient),
      checkAnswers,
    )
    router.get(
      [
        '/case/:crn/arrange-appointment/:id/check-your-answers',
        '/case/:crn/appointments/appointment/:contactId/check-your-answers',
      ],
      getPersonAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      controllers.arrangeAppointments.getCheckYourAnswers(),
    )

    router.post(
      [
        '/case/:crn/arrange-appointment/:id/check-your-answers',
        '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      ],
      getPersonAppointment(hmppsAuthClient),
      handlePostAppointment(hmppsAuthClient),
      getOutcomeProps,
      getOutcomeSentence(hmppsAuthClient),
      getContactOutcomes(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      handlePutOutcome(hmppsAuthClient),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/check-your-answers',
      controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
    )
    router.get(
      '/case/:crn/arrange-appointment/:id/confirmation',
      restrictPageAccess({ requiredValues: ['eventId', 'type', ['user', 'locationCode']] }),
      getOverdueOutcomes(hmppsAuthClient),
      controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
    )
    router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
    router.get(
      '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      getOutcomeProps,
      getContactOutcomes(hmppsAuthClient),
      getOutcomeSentence(hmppsAuthClient),
      getNotePrepend,
      getOutcomeSummary,
      controllers.arrangeAppointments.getArrangeAnotherAppointment(),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
      controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
    )
    router.all(
      '/case/:crn/arrange-appointment/:id/text-message-confirmation',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'start', ['user', 'locationCode']] }),
      getPersonalDetails(hmppsAuthClient, arnsComponents),
      getSmsPreview(hmppsAuthClient),
      getSmsConfirmationOptions,
    )
    router.get(
      '/case/:crn/arrange-appointment/:id/text-message-confirmation',
      controllers.arrangeAppointments.getTextMessageConfirmation(hmppsAuthClient),
    )
    router.post(
      '/case/:crn/arrange-appointment/:id/text-message-confirmation',
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

    /* Delete these routes after enableNonCompliance feature flag is removed 👇 */

    router.all(
      '/case/:crn/arrange-appointment/:id/add-note',
      restrictPageAccess({ requiredValues: ['eventId', 'type', 'date', 'outcomeRecorded'] }),
      getPersonalDetails(hmppsAuthClient, arnsComponents),
      getAppointment(hmppsAuthClient),
      getOutcomeProps,
    )
    router.get(
      '/case/:crn/arrange-appointment/:id/add-note',
      forceValidation,
      controllers.arrangeAppointments.getAddNote(),
    )

    router.post(
      '/case/:crn/arrange-appointment/:id/add-note',
      validate.appointments,
      autoStoreSessionData(hmppsAuthClient),
      controllers.arrangeAppointments.postAddNote(),
    )

    /* ----------------- 👆 -----------------  */
  }
}

export default arrangeAppointmentRoutes
