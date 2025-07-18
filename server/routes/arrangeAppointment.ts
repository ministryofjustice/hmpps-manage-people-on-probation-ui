import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getWhoAttends,
  getOfficeLocationsByTeamAndProvider,
  getSentences,
  getAppointmentTypes,
  getAppointment,
  redirectWizard,
} from '../middleware'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { Route } from '../@types'
import controllers from '../controllers'
import { checkAppointments } from '../middleware/checkAppointments'

// const upload = multer()
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: MAX_FILE_SIZE },
//   fileFilter: (req, file, cb) => {
//     if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
//       cb(null, true)
//     } else {
//       cb(new Error(`Unsupported file type: ${file.mimetype}`))
//     }
//   },
// })
const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all('/case/:crn/arrange-appointment/:id/*path', getAppointmentTypes(hmppsAuthClient))
  router.get('/case/:crn/arrange-appointment/:id/*path', getAppointment(hmppsAuthClient))
  get('/case/:crn/arrange-appointment/type', controllers.arrangeAppointments.redirectToType())
  get('/case/:crn/arrange-appointment/:id/type', controllers.arrangeAppointments.getType())

  router.post('/case/:crn/arrange-appointment/:id/*path', [
    autoStoreSessionData(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/arrange-appointment/:id/type',
    validate.appointments,
    controllers.arrangeAppointments.postType(),
  )

  router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))

  router.get(
    '/case/:crn/arrange-appointment/:id/sentence',
    redirectWizard(['type']),
    controllers.arrangeAppointments.getSentence(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    validate.appointments,
    controllers.arrangeAppointments.postSentence(),
  )
  router.all('/case/:crn/arrange-appointment/:id/attendance', getWhoAttends(hmppsAuthClient))
  router.get(
    '/case/:crn/arrange-appointment/:id/attendance',
    redirectWizard(['type', 'eventId']),
    controllers.arrangeAppointments.getWhoWillAttend(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance',
    validate.appointments,
    controllers.arrangeAppointments.postWhoWillAttend(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location',
    redirectWizard(['type', 'eventId']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    controllers.arrangeAppointments.getLocation(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/location',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    validate.appointments,
    controllers.arrangeAppointments.postLocation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    redirectWizard(['type', 'eventId']),
    getPersonalDetails(hmppsAuthClient),
    controllers.arrangeAppointments.getLocationNotInList(),
  )

  router.all('/case/:crn/arrange-appointment/:id/date-time', getPersonalDetails(hmppsAuthClient), getTimeOptions)

  router.get(
    '/case/:crn/arrange-appointment/:id/date-time',
    redirectWizard(['type', 'eventId', ['user', 'locationCode']]),
    controllers.arrangeAppointments.getDateTime(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/date-time',
    validate.appointments,
    checkAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postDateTime(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/repeating',
    redirectWizard(['type', 'eventId', ['user', 'locationCode'], 'date']),
    controllers.arrangeAppointments.getRepeating(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/repeating',
    validate.appointments,
    controllers.arrangeAppointments.postRepeating(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/add-notes',
    // redirectWizard(['type', 'eventId', ['user', 'locationCode'], 'date', 'repeating']),
    controllers.arrangeAppointments.getNotes(),
  )

  /*
  router.post(
    '/case/:crn/arrange-appointment/:id/add-notes',
    upload.single('outOfBoundFilename'),
    validate.appointments,
    controllers.arrangeAppointments.postNotes(),
  )
    */

  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['type', 'eventId', ['user', 'locationCode'], 'date', 'repeating']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    redirectWizard(['type', 'eventId', ['user', 'locationCode'], 'date', 'repeating']),
    getPersonalDetails(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(),
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    redirectWizard(['type', 'eventId', ['user', 'locationCode'], 'repeating']),
    controllers.arrangeAppointments.getArrangeAnotherAppointment(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
  )
}

export default arrangeAppointmentRoutes
