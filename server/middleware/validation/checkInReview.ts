import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/ESupervision'
import { checkInReviewValidation } from '../../properties/validation/checkInReviewValidation'

const checkInReview: Route<void> = (req, res, next) => {
  const { url, params } = req
  const { crn, id } = params as Record<string, string>
  const { checkIn } = res.locals
  const { back = '' } = req.query as Record<string, string>

  const localParams: LocalParams = {
    crn,
    id,
    back,
  }

  const baseUrl = req.url.split('?')[0]
  let render = `pages/${[
    url
      .split('?')[0]
      .split('/')
      .filter(item => item)
      .filter((_item, i) => ![0, 1, 2, 3].includes(i))
      .join('/'),
  ]}`

  const validateCheckInView = () => {
    if (baseUrl.includes(`case/${crn}/appointments/${id}/check-in/view`)) {
      render = `pages/check-in/view`
      errorMessages = validateWithSpec(
        req.body,
        checkInReviewValidation({
          crn,
          id,
          page: 'view',
        }),
      )
    }
  }

  const validateCheckInReviewIdentity = () => {
    if (baseUrl.includes(`case/${crn}/appointments/${id}/check-in/review/identity`)) {
      render = `pages/check-in/review/identity`
      errorMessages = validateWithSpec(
        req.body,
        checkInReviewValidation({
          crn,
          id,
          page: 'identity',
        }),
      )
    }
  }
  const validateCheckInReviewExpired = () => {
    if (baseUrl.includes(`case/${crn}/appointments/${id}/check-in/review/expired`)) {
      render = `pages/check-in/review/expired`
      errorMessages = validateWithSpec(
        req.body,
        checkInReviewValidation({
          crn,
          id,
          page: 'expired',
        }),
      )
    }
  }
  let errorMessages: Record<string, string> = {}
  validateCheckInReviewIdentity()
  validateCheckInReviewExpired()
  validateCheckInView()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams, checkIn })
  }
  return next()
}

export default checkInReview
