import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'

import { eSuperVisionValidation } from '../../properties/validation/eSupervision'
import { LocalParams } from '../../models/ESupervision'

const eSuperVision: Route<void> = (req, res, next) => {
  const { url, params, body } = req
  const { crn, id } = params
  const { checkInMinDate } = body
  const { back = '' } = req.query as Record<string, string>
  const localParams: LocalParams = {
    crn,
    id,
    body,
    back,
    checkInMinDate,
  }
  const baseUrl = req.url.split('?')[0]
  let render = `pages/${[
    url
      .split('?')[0]
      .split('/')
      .filter(item => item)
      .filter((_item, i) => ![0, 1, 3].includes(i))
      .join('/'),
  ]}`

  const validateCheckins = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/date-frequency`)) {
      render = `pages/check-in/date-frequency`
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          page: 'date-frequency',
        }),
      )
    }
  }
  let errorMessages: Record<string, string> = {}
  validateCheckins()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default eSuperVision
