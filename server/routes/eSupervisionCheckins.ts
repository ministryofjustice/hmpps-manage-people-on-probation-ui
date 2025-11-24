import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation'
import { autoStoreSessionData } from '../middleware'

export default function eSuperVisionCheckInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.get('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.getIntroPage(hmppsAuthClient)])

  router.post('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.postIntroPage(hmppsAuthClient)])

  router.get('/case/:crn/appointments/:id/check-in/date-frequency', [
    controllers.checkIns.getDateFrequencyPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/date-frequency',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postDateFrequencyPage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/contact-preference', [
    controllers.checkIns.getContactPreferencePage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postContactPreferencePage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-options', [
    controllers.checkIns.getPhotoOptionsPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postContactPreferencePage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/edit-contact-preference', [
    controllers.checkIns.getEditContactPrePage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/edit-contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postEditContactPrePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-options', [
    controllers.checkIns.getPhotoOptionsPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/photo-options',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/take-a-photo', [
    controllers.checkIns.getTakePhotoPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/:id/check-in/upload-a-photo', [
    controllers.checkIns.getUploadPhotoPage(hmppsAuthClient),
  ])
}
