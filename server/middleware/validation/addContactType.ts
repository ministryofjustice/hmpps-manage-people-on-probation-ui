import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { addContactValidation } from '../../properties/validation/addContactType'

const addContactType: Route<void> = (req, res, next) => {
  const { crn } = req.params

  const errorMessages = validateWithSpec(req.body, addContactValidation())

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    const { responsibleOfficer, isVisor } = req.body
    return res.render('pages/contacts/add-contact-type', {
      errorMessages,
      crn,
      formValues: req.body,
      isVisor,
      responsibleOfficer,
    })
  }
  return next()
}

export default addContactType
