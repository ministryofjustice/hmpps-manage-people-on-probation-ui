import { type Router } from 'express'
import { type Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation/index'
import { multerErrorHandler } from '../middleware/validation/multerErrorHandler'
import { getSentences } from '../middleware'

export default function addContactRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.all('/case/:crn/add-contact', getSentences(hmppsAuthClient), (req, res, next) => {
    res.locals.title = 'Add [contactType]'
    next()
  })

  router.get('/case/:crn/add-contact', controllers.addContact.getAddContact())

  router.post(
    '/case/:crn/add-contact',
    multerErrorHandler('fileUpload'),
    validate.addContact,
    controllers.addContact.postAddContact(),
  )
}
