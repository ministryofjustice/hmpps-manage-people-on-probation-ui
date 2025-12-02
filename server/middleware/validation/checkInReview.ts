import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/ESupervision'
import { getDataValue } from '../../utils'
import ESupervisionClient from '../../data/eSupervisionClient'
import { HmppsAuthClient } from '../../data'
import { checkInReviewValidation } from '../../properties/validation/checkInReviewValidation'
import { ESupervisionReview } from '../../data/model/esupervision'

const checkInReview = (hmppsAuthClient: HmppsAuthClient): Route<void> => {
  return async (req, res, next) => {
    const { url, params } = req
    const { crn, id } = params

    const { back = '' } = req.query as Record<string, string>

    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
    const checkIn = checkInResponse.checkin

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
        .filter((_item, i) => ![0, 1, 3].includes(i))
        .join('/'),
    ]}`

    const validateCheckInReviewIdentity = () => {
      if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/review/identity`)) {
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
    const validateCheckInReviewNotes = () => {
      if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/review/notes`)) {
        render = `pages/check-in/review/notes`
        errorMessages = validateWithSpec(
          req.body,
          checkInReviewValidation({
            crn,
            id,
            page: 'notes',
          }),
        )
      }
    }
    const validateCheckInReviewExpired = () => {
      if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/review/expired`)) {
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
    validateCheckInReviewNotes()
    validateCheckInReviewExpired()
    if (Object.keys(errorMessages).length) {
      res.locals.errorMessages = errorMessages
      return res.render(render, { errorMessages, ...localParams, checkIn })
    }
    return next()
  }
}

export default checkInReview
