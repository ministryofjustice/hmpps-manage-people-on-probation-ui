import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { addFrequentlyUsedContactValidation } from '../../properties/validation/addFrequentlyUsedContact'
import { deliusDeepLinkUrl } from '../../utils'

const addFrequentlyUsedContact: Route<void> = (req, res, next) => {
  const { crn } = req.params
  const errorMessages = validateWithSpec(req.body, addFrequentlyUsedContactValidation())
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages

    return res.render('pages/contacts/add-frequently-used-contact', {
      errorMessages,
      crn,
      formValues: req.body,
      sentences: res.locals.sentences,
      radioItems: res.locals.radioItems,
      ndeliusDeepLinkUrl: deliusDeepLinkUrl('ContactList', crn),
      contactLogUrl: `/case/${crn}/activity-log/`,
    })
  }
  return next()
}

export default addFrequentlyUsedContact
