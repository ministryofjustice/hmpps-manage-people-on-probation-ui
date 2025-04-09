import type { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function personalDetailRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: Route<void>) => router.post(path, asyncMiddleware(handler))
  get(
    [
      '/case/:crn/personal-details',
      '/case/:crn/personal-details/edit-contact-details',
      '/case/:crn/personal-details/edit-main-address',
    ],
    controllers.personalDetails.getPersonalDetails(hmppsAuthClient),
  )

  post(
    ['/case/:crn/personal-details/edit-contact-details', '/case/:crn/personal-details/edit-main-address'],
    controllers.personalDetails.postEditDetails(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/staff-contacts', controllers.personalDetails.getStaffContacts(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/personal-contact/:id',
    controllers.personalDetails.getPersonalContact(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/personal-contact/:id/note/:noteId',
    controllers.personalDetails.getPersonalContactNote(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/main-address/note/:noteId',
    controllers.personalDetails.getMainAddressNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/addresses', controllers.personalDetails.getAddresses(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/addresses/:addressId/note/:noteId',
    controllers.personalDetails.getAddressesNote(hmppsAuthClient),
  )

  get(
    '/case/:crn/personal-details/documents/:documentId/download',
    controllers.personalDetails.getDocumentsDownload(hmppsAuthClient),
  )

  get('/case/:crn/handoff/:system', controllers.personalDetails.getHandoff(hmppsAuthClient))

  get('/case/:crn/personal-details/disabilities', controllers.personalDetails.getDisabilities(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/disability/:disabilityId/note/:noteId',
    controllers.personalDetails.getDisabilitiesNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/adjustments', controllers.personalDetails.getAdjustments(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/adjustments/:adjustmentId/note/:noteId',
    controllers.personalDetails.getAdjustmentsNote(hmppsAuthClient),
  )

  get('/case/:crn/personal-details/circumstances', controllers.personalDetails.getCircumstances(hmppsAuthClient))

  get(
    '/case/:crn/personal-details/circumstances/:circumstanceId/note/:noteId',
    controllers.personalDetails.getCircumstancesNote(hmppsAuthClient),
  )
}
