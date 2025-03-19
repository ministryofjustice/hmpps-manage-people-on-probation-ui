import type { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import renders from '../controllers/renders'

export default function personalDetailRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: Route<void>) => router.post(path, asyncMiddleware(handler))
  get(
    [
      '/case/:crn/personal-details',
      '/case/:crn/personal-details/edit-contact-details',
      '/case/:crn/personal-details/edit-main-address',
    ],
    renders.personalDetailsController.personalDetails(hmppsAuthClient),
  )

  post(
    ['/case/:crn/personal-details/edit-contact-details', '/case/:crn/personal-details/edit-main-address'],
    renders.personalDetailsController.editDetails(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/staff-contacts', renders.personalDetailsController.staffContacts(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/personal-contact/:id',
    renders.personalDetailsController.personalContact(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/personal-contact/:id/note/:noteId',
    renders.personalDetailsController.personalContactNote(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/main-address/note/:noteId',
    renders.personalDetailsController.mainAddressNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/addresses', renders.personalDetailsController.addresses(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/addresses/:addressId/note/:noteId',
    renders.personalDetailsController.addressesNote(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/documents/:documentId/download',
    renders.personalDetailsController.documentsDownload(hmppsAuthClient),
  )

  get('/case/:crn/handoff/:system', renders.personalDetailsController.handoff(hmppsAuthClient))

  get('/case/:crn/personal-details/disabilities', renders.personalDetailsController.disabilities(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/disability/:disabilityId/note/:noteId',
    renders.personalDetailsController.disabilitiesNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/adjustments', renders.personalDetailsController.adjustments(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/adjustments/:adjustmentId/note/:noteId',
    renders.personalDetailsController.adjustmentsNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/circumstances', renders.personalDetailsController.circumstances(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/circumstances/:circumstanceId/note/:noteId',
    renders.personalDetailsController.circumstancesNote(hmppsAuthClient),
  )
}
