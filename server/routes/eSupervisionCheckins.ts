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
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postIntroPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/date-frequency', [
    redirectWizard(['id'], 'setupcheckins'),
    controllers.checkIns.getDateFrequencyPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/date-frequency',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    postRedirectWizard(),
    controllers.checkIns.postDateFrequencyPage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/contact-preference', [
    redirectWizard(['date', 'interval'], 'setupcheckins'),
    controllers.checkIns.getContactPreferencePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/contact-preference',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    postRedirectWizard(),
    controllers.checkIns.postContactPreferencePage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/edit-contact-preference', [
    redirectWizard(['date', 'interval'], 'setupcheckins'),
    controllers.checkIns.getEditContactPrePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/edit-contact-preference',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postEditContactPrePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-options', [
    redirectWizard(['preferredComs'], 'setupcheckins'),
    controllers.checkIns.getPhotoOptionsPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-options',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
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
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-rules', [
    redirectWizard(['photoUploadOption'], 'setupcheckins'),
    controllers.checkIns.getPhotoRulesPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-rules',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
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
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postManageCheckinDatePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/contact', [
    controllers.checkIns.getManageContactPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/contact',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postManageContactPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/edit-contact', [
    controllers.checkIns.getManageEditContactPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/check-in/manage/:id/edit-contact',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
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

  router.get('/case/:crn/appointments/:id/check-in/update', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getUpdateCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/view', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getViewCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/view', [
    validate.checkInReview,
    autoStoreSessionData(hmppsAuthClient),
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.postViewCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/view-expired', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/view-expired', [
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postViewCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/review/expired', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/review/expired', [
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postReviewCheckIn(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/:id/check-in/review/identity', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/review/identity', [
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    autoStoreSessionData(hmppsAuthClient),
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
