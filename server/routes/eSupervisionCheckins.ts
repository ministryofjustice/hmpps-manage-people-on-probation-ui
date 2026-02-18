import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation'
import { autoStoreSessionData, redirectWizard } from '../middleware'
import { getCheckIn } from '../middleware/getCheckIn'
import { postRedirectWizard } from '../middleware/checkinCyaRedirect'

export default function eSuperVisionCheckInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.get('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.getStartSetup(hmppsAuthClient)])
  router.get('/case/:crn/appointments/:id/check-in/instructions', [controllers.checkIns.getIntroPage(hmppsAuthClient)])
  router.post(
    '/case/:crn/appointments/:id/check-in/instructions',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postIntroPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/date-frequency', [
    redirectWizard(['id'], 'setupcheckins'),
    controllers.checkIns.getDateFrequencyPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/date-frequency',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    postRedirectWizard(),
    controllers.checkIns.postDateFrequencyPage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/contact-preference', [
    redirectWizard(['date', 'interval'], 'setupcheckins'),
    controllers.checkIns.getContactPreferencePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    postRedirectWizard(),
    controllers.checkIns.postContactPreferencePage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/edit-contact-preference', [
    redirectWizard(['date', 'interval'], 'setupcheckins'),
    controllers.checkIns.getEditContactPrePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/edit-contact-preference',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postEditContactPrePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-options', [
    redirectWizard(['preferredComs'], 'setupcheckins'),
    controllers.checkIns.getPhotoOptionsPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-options',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/take-a-photo', [
    redirectWizard(['photoUploadOption'], 'setupcheckins'),
    controllers.checkIns.getTakePhotoPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/take-a-photo',
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/upload-a-photo', [
    redirectWizard(['photoUploadOption'], 'setupcheckins'),
    controllers.checkIns.getUploadPhotoPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/upload-a-photo',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-rules', [
    redirectWizard(['photoUploadOption'], 'setupcheckins'),
    controllers.checkIns.getPhotoRulesPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-rules',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postPhotoRulesPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/checkin-summary', [
    redirectWizard(['photoUploadOption'], 'setupcheckins'),
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

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
    controllers.checkIns.getRestartCheckinPage(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postRestartDateFrequency(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-contact',
    controllers.checkIns.getRestartContactPage(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/check-in/manage/:id/restart-contact',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postRestartContactPage(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-edit-contact',
    controllers.checkIns.getRestartEditContactPage(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/check-in/manage/:id/restart-edit-contact',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postRestartEditContactPage(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-summary',
    controllers.checkIns.getRestartSummaryPage(hmppsAuthClient),
  )
  // router.post(
  //   '/case/:crn/appointments/check-in/manage/:id/restart-summary',
  //   validate.eSuperVision,
  //   controllers.checkIns.postFinalRestart(hmppsAuthClient),
  // )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-confirmation',
    controllers.checkIns.getRestartConfirmation(hmppsAuthClient),
  )

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
}
