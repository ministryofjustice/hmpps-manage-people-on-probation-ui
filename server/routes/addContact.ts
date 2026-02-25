import { type Router } from 'express'
import { type Services } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import controllers from '../controllers'

export default function addContactRoutes(router: Router, _services: Services) {
  router.get('/case/:crn/add-contact', controllers.addContact.getAddContact())
}
