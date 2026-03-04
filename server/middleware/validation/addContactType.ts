import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { addContactValidation } from '../../properties/validation/addContactType'

const addContactType: Route<void> = (req, res, next) => {
  const { crn } = req.params

  const responsibleOfficer: string = req.body?.responsibleOfficer
  const isVisor: string = req.body?.isVisor
  const responsibleOfficerSurname: string = req.body?.responsibleOfficerSurname
  const responsibleOfficerForename: string = req.body?.responsibleOfficerForename
  const errorMessages = validateWithSpec(req.body, addContactValidation({ responsibleOfficer, isVisor }))

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render('pages/contacts/add-contact-type', {
      errorMessages,
      crn,
      formValues: req.body,
      isVisor,
      responsibleOfficer,
      responsibleOfficerForename,
      responsibleOfficerSurname,
    })
  }
  return next()
}

export default addContactType
