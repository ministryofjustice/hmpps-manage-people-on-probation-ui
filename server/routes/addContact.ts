import { type Router } from 'express'
import { type Services } from '../services'
import controllers from '../controllers'

export default function addContactRoutes(router: Router, _services: Services) {
  router.get('/case/:crn/add-contact', controllers.addContact.getAddContact())
}
