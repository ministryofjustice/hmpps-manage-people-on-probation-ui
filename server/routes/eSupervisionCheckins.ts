import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation'
import { autoStoreSessionData } from '../middleware'
import { getCheckIn } from '../middleware/getCheckIn'
import { redirectWizard } from '../middleware/checkinCyaRedirect'

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
    redirectWizard(),
    controllers.checkIns.postDateFrequencyPage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/contact-preference', [
    controllers.checkIns.getContactPreferencePage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    redirectWizard(),
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

  router.post(
    '/case/:crn/appointments/:id/check-in/upload-a-photo',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-rules', [
    controllers.checkIns.getPhotoRulesPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/:id/check-in/update', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getUpdateCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/view', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getViewCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/view', [
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    controllers.checkIns.postViewCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/view-expired', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/view-expired', [
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    controllers.checkIns.postViewCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/review/expired', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/review/expired', [
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    controllers.checkIns.postReviewCheckIn(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/:id/check-in/review/identity', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/review/identity', [
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    controllers.checkIns.postReviewIdentityCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/review/notes', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/review/notes', [
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.postReviewCheckIn(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/photo-rules',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postPhotoRulesPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/checkin-summary', [
    controllers.checkIns.getCheckinSummaryPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/confirm-start',
    controllers.checkIns.postCheckinSummaryPage(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/:id/check-in/confirm-end',
    controllers.checkIns.getConfirmationPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/video', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getCheckinVideoPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/take-a-photo',
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id', [
    controllers.checkIns.getManageCheckinPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/settings', [
    controllers.checkIns.getManageCheckinDatePage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/settings',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postManageCheckinDatePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/contact', [
    controllers.checkIns.getManageContactPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/contact',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postManageContactPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/edit-contact', [
    controllers.checkIns.getManageEditContactPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/edit-contact',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postManageEditContactPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/stop-checkin', [
    controllers.checkIns.getStopCheckinPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/stop-checkin',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postManageStopCheckin(hmppsAuthClient),
  )
}
