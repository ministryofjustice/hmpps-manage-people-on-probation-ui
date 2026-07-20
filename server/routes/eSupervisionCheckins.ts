import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation'
import { autoStoreSessionData, restrictPageAccess, renderError } from '../middleware'
import { getCheckIn } from '../middleware/getCheckIn'
import { postRedirectWizard } from '../middleware/checkinCyaRedirect'
import { AppResponse } from '../models/Locals'
import { getCheckInQuestionsRedirect } from '../middleware/getCheckInQuestionsRedirect'
import { redirectToManageCheckInService } from '../middleware/redirectToManageCheckInService'

export default function eSuperVisionCheckInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.use(
    ['/case/:crn/appointments/check-in', '/case/:crn/appointments/:id/check-in'],
    (req, res: AppResponse, next) => {
      if (res.locals.flags?.enableESupervisionCheckins !== true) {
        return renderError(403)(req, res)
      }
      return next()
    },
  )
  router.get('/case/:crn/appointments/check-in/eligibility-check', [
    controllers.checkIns.getStartSetup(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/eligibility-check', [
    controllers.checkIns.getEligibilityPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/eligibility-check',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postEligibilityPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/denied-eligibility', [
    controllers.checkIns.getEligibilityDeniedPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/denied-eligibility',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postEligibilityDeniedPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/full-eligibility', [
    controllers.checkIns.getFullEligibilityPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/full-eligibility',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postFullEligibilityPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/supplementary-eligibility', [
    controllers.checkIns.getSupplementaryEligibilityPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/supplementary-eligibility',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postSupplementaryEligibilityPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/spo-approval', [
    restrictPageAccess({ requiredValues: ['eligibility', 'eligibilityChoice'], route: 'setupcheckins' }),
    controllers.checkIns.getSPOApprovalPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/spo-approval',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    postRedirectWizard(),
    controllers.checkIns.postSPOApprovalPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/rationale', [
    restrictPageAccess({ requiredValues: ['id'], route: 'setupcheckins' }),
    controllers.checkIns.getRationalePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/rationale',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    postRedirectWizard(),
    controllers.checkIns.postRationalePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/date-frequency', [
    restrictPageAccess({ requiredValues: ['id'], route: 'setupcheckins' }),
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
    restrictPageAccess({ requiredValues: ['date', 'interval'], route: 'setupcheckins' }),
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
    restrictPageAccess({ requiredValues: ['date', 'interval'], route: 'setupcheckins' }),
    controllers.checkIns.getEditContactPrePage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/edit-contact-preference',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postEditContactPrePage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-options', [
    restrictPageAccess({ requiredValues: ['preferredComs'], route: 'setupcheckins' }),
    controllers.checkIns.getPhotoOptionsPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-options',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/take-a-photo', [
    restrictPageAccess({ requiredValues: ['photoUploadOption'], route: 'setupcheckins' }),
    controllers.checkIns.getTakePhotoPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/take-a-photo',
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/upload-a-photo', [
    restrictPageAccess({ requiredValues: ['photoUploadOption'], route: 'setupcheckins' }),
    controllers.checkIns.getUploadPhotoPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/upload-a-photo',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient),
  )

  router.get('/case/:crn/appointments/:id/check-in/photo-rules', [
    restrictPageAccess({ requiredValues: ['photoUploadOption'], route: 'setupcheckins' }),
    controllers.checkIns.getPhotoRulesPage(hmppsAuthClient),
  ])
  router.post(
    '/case/:crn/appointments/:id/check-in/photo-rules',
    validate.eSuperVision,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postPhotoRulesPage(hmppsAuthClient),
  )
  router.get('/case/:crn/appointments/:id/check-in/checkin-summary', [
    restrictPageAccess({ requiredValues: ['photoUploadOption'], route: 'setupcheckins' }),
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

  // Check these routes against the enableESUPCheckinNewRestart flag
  // and redirect to the manage online check-ins service if set
  router.use(
    [
      '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
      '/case/:crn/appointments/check-in/manage/:id/restart-contact',
      '/case/:crn/appointments/check-in/manage/:id/restart-edit-contact',
      '/case/:crn/appointments/check-in/manage/:id/restart-summary',
      '/case/:crn/appointments/check-in/manage/:id/restart-confirmation',
    ],
    redirectToManageCheckInService('enableESUPCheckinNewRestart'),
  )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
    controllers.checkIns.getRestartCheckinPage(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postRestartCheckinPage(hmppsAuthClient),
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
  router.post(
    '/case/:crn/appointments/check-in/manage/:id/restart-summary',
    validate.eSuperVision,
    controllers.checkIns.postRestartSummaryPage(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/check-in/manage/:id/restart-confirmation',
    controllers.checkIns.getRestartConfirmation(hmppsAuthClient),
  )

  // Check these routes against the enableESUPCheckinNewReview flag
  // and redirect to the manage online check-ins service if set
  router.use(
    [
      '/case/:crn/appointments/:id/check-in/update',
      '/case/:crn/appointments/:id/check-in/view',
      '/case/:crn/appointments/:id/check-in/view-expired',
      '/case/:crn/appointments/:id/check-in/review',
    ],
    redirectToManageCheckInService('enableESUPCheckinNewReview'),
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
    getCheckIn(hmppsAuthClient),
    autoStoreSessionData(hmppsAuthClient),
    validate.checkInReview,
    controllers.checkIns.postViewCheckIn(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/:id/check-in/view-expired', [
    getCheckIn(hmppsAuthClient),
    controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/:id/check-in/view-expired', [
    getCheckIn(hmppsAuthClient),
    autoStoreSessionData(hmppsAuthClient),
    validate.checkInReview,
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
    getCheckIn(hmppsAuthClient),
    validate.checkInReview,
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postReviewCheckIn(hmppsAuthClient),
  ])

  // Check these routes against the enableESUPCheckinNewQuestions flag
  // and redirect to the manage online check-ins service if set
  router.use(
    [
      '/case/:crn/appointments/check-in/manage/:id/questions/start',
      '/case/:crn/appointments/check-in/manage/:id/questions/add',
      '/case/:crn/appointments/check-in/manage/:id/questions/list',
      '/case/:crn/appointments/check-in/manage/:id/questions/:questionId/edit',
      '/case/:crn/appointments/check-in/manage/:id/questions/:templateId/select',
      '/case/:crn/appointments/check-in/manage/:id/questions/:questionId/delete',
      '/case/:crn/appointments/check-in/manage/:id/questions/preview/feeling',
      '/case/:crn/appointments/check-in/manage/:id/questions/preview/support',
    ],
    redirectToManageCheckInService('enableESUPCheckinNewQuestions'),
  )

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/start', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getStartQuestionsPage(hmppsAuthClient),
  ])
  router.post('/case/:crn/appointments/check-in/manage/:id/questions/start', [
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postStartQuestionsPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/add', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getAddQuestionsPage(hmppsAuthClient),
  ])

  router.post('/case/:crn/appointments/check-in/manage/:id/questions/add', [
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postAddQuestionsPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/list', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getQuestionsListPage(hmppsAuthClient),
  ])

  router.post('/case/:crn/appointments/check-in/manage/:id/questions/list', [
    autoStoreSessionData(hmppsAuthClient),
    controllers.checkIns.postQuestionsListPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/:questionId/edit', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getEditQuestionPage(hmppsAuthClient),
  ])

  router.post('/case/:crn/appointments/check-in/manage/:id/questions/:questionId/edit', [
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postEditQuestionPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/:templateId/select', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getSelectQuestionPage(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/:questionId/delete', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getDeleteQuestion(hmppsAuthClient),
  ])

  router.get('/case/:crn/appointments/check-in/manage/:id/questions/preview/feeling', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getPreviewFeelingPage(hmppsAuthClient),
  ])
  router.get('/case/:crn/appointments/check-in/manage/:id/questions/preview/support', [
    getCheckInQuestionsRedirect(hmppsAuthClient),
    controllers.checkIns.getPreviewSupportPage(hmppsAuthClient),
  ])
}
