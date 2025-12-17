import { Route } from '../../@types'
import { validateWithSpec } from '../../utils/validationUtils'

import { eSuperVisionValidation } from '../../properties/validation/eSupervision'
import { LocalParams } from '../../models/ESupervision'
import { getDataValue } from '../../utils'

const eSuperVision: Route<void> = (req, res, next) => {
  const { url, params, body } = req
  const { crn, id } = params
  const { checkInMinDate, checkInMobile, checkInEmail } = body
  const editCheckInMobile = getDataValue(req.session.data, ['esupervision', crn, id, 'checkins', 'editCheckInMobile'])
  const editCheckInEmail = getDataValue(req.session.data, ['esupervision', crn, id, 'checkins', 'editCheckInEmail'])
  const manageEditCheckInMobile = getDataValue(req.session.data, [
    'esupervision',
    crn,
    id,
    'mangeCheckin',
    'editCheckInMobile',
  ])
  const manageEditCheckInEmail = getDataValue(req.session.data, [
    'esupervision',
    crn,
    id,
    'mangeCheckin',
    'editCheckInEmail',
  ])

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
        }),
      )
    }
  }
  const validateEditContactPreference = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/${id}/check-in/edit-contact-preference`)) {
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
  const validateCheckinSettings = () => {
    if (baseUrl.includes(`case/${crn}/appointments/check-in/manage/${id}/settings`)) {
      render = `pages/check-in/manage/checkin-settings`
      localParams.id = id
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          page: 'checkin-settings',
        }),
      )
    }
  }

  const validateManageEditContactPreference = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/check-in/manage/${id}/edit-contact`)) {
      render = `pages/check-in/manage/manage-edit-contact`
      localParams.id = id
      errorMessages = validateWithSpec(
        req.body,
        eSuperVisionValidation({
          crn,
          id,
          checkInEmail,
          checkInMobile,
          editCheckInEmail: manageEditCheckInEmail,
          editCheckInMobile: manageEditCheckInMobile,
          page: 'edit-contact',
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
  validateCheckinSettings()
  validateManageEditContactPreference()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default eSuperVision
