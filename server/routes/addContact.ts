import { type Router } from 'express'
import { type Services } from '../services'
import controllers from '../controllers'
import { getSentences } from '../middleware'
import validate from '../middleware/validation/index'
import { multerErrorHandler } from '../middleware/validation/multerErrorHandler'
import { populateContactTypes } from '../middleware/populateContactTypes'

export default function addContactRoutes(router: Router, { hmppsAuthClient }: Services) {
  const populate = populateContactTypes(hmppsAuthClient)

  router.get(
    '/case/:crn/add-frequently-used-contact',
    populate,
    controllers.addContact.getFrequentlyUsedContact(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/add-frequently-used-contact',
    populate,
    validate.addFrequentlyUsedContact,
    controllers.addContact.postFrequentlyUsedContact(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/contacts/add-:contactType',
    getSentences(hmppsAuthClient),
    controllers.addContact.getAddContactType(hmppsAuthClient),
  )

  router.all('/case/:crn/contacts/add-:contactType', getSentences(hmppsAuthClient), (req, res, next) => {
    // res.locals.title = 'Add [contactType]'
    next()
  })

  router.post(
    '/case/:crn/contacts/add-:contactType',
    multerErrorHandler('fileUpload'),
    validate.addContactType,
    controllers.addContact.postAddContactType(),
  )

  router.get(
    '/case/:crn/contacts/alert-responsible-officer',
    controllers.addContact.getAlertResponsibleOfficer(hmppsAuthClient),
  )
}
