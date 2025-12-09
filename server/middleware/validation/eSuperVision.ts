import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'

import { eSuperVisionValidation } from '../../properties/validation/eSupervision'
import { LocalParams } from '../../models/ESupervision'
import { getDataValue, setDataValue } from '../../utils'

const eSuperVision: Route<void> = (req, res, next) => {
  const { url, params, body } = req
  const { crn, id } = params
  const { checkInMinDate, checkInMobile, checkInEmail } = body
  const editCheckInMobile = getDataValue(req.session.data, ['esupervision', crn, id, 'checkins', 'editCheckInMobile'])
  const editCheckInEmail = getDataValue(req.session.data, ['esupervision', crn, id, 'checkins', 'editCheckInEmail'])

  const { back = '' } = req.query as Record<string, string>
  const localParams: LocalParams = {
    crn,
    id,
    body,
    back,
    checkInMinDate,
    checkInEmail,
    checkInMobile,
    editCheckInEmail,
    editCheckInMobile,
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

  const validateDateFrequency = () => {
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
  const validateContactPreference = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/contact-preference`)) {
      render = `pages/check-in/contact-preference`
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          checkInEmail,
          checkInMobile,
          page: 'contact-preference',
          change: req.body.change,
        }),
      )
    }
  }
  const validateEditContactPreference = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/edit-contact-preference`)) {
      const preferredComs = getDataValue(req.session.data, ['esupervision', crn, id, 'checkins', 'preferredComs'])

      render = `pages/check-in/edit-contact-preference`
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          checkInEmail,
          checkInMobile,
          editCheckInEmail,
          editCheckInMobile,
          page: 'edit-contact-preference',
          change: preferredComs,
        }),
      )
    }
  }

  const validatePhotoOptionsPage = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/photo-options`)) {
      render = `pages/check-in/photo-options`
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          page: 'photo-options',
        }),
      )
    }
  }
  const validateUploadPhotoPage = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/upload-a-photo`)) {
      render = `pages/check-in/upload-a-photo`
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          page: 'upload-a-photo',
        }),
      )
    }
  }
  let errorMessages: Record<string, string> = {}
  validateDateFrequency()
  validateContactPreference()
  validateEditContactPreference()
  validatePhotoOptionsPage()
  validateUploadPhotoPage()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default eSuperVision
