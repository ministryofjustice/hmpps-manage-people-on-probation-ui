import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { addContactValidation } from '../../properties/validation/addContact'

const addContact: Route<void> = (req, res, next) => {
  const { crn } = req.params

  const errorMessages = validateWithSpec(req.body, addContactValidation())

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render('pages/contact-log/contact/contact', { errorMessages, crn, formValues: req.body })
  }
  return next()
}

export default addContact
