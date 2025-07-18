import { Route } from '../../@types'
import { getDataValue } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'
import { normaliseMultipartBody } from '../normaliseMultipartBody'

const appointments: Route<void> = (req, res, next) => {
  const { url, params } = req
  const { crn, id } = params
  const localParams: LocalParams = { crn, id }
  const render = `pages/${[
    url
      .split('?')[0]
      .split('/')
      .filter(item => item)
      .filter((_item, i) => ![0, 1, 3].includes(i))
      .join('/'),
  ]}`

  const validateType = (): void => {
    if (req.url.includes('/type')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({ crn, id, page: 'type', visor: req.body?.visor }),
      )
    }
  }

  const validateSentence = (): void => {
    if (req.url.includes('/sentence')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'sentence',
        }),
      )
    }
  }

  const validateLocation = (): void => {
    if (req.url.includes('/location')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'location',
        }),
      )
    }
  }

  const validateDateTime = (): void => {
    if (req.url.includes('/date-time')) {
      // eslint-disable-next-line no-underscore-dangle
      localParams.minDate = req.body._minDate
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'datetime',
        }),
      )
    }
  }

  const validateRepeating = () => {
    if (req.url.includes('/repeating')) {
      const repeatingValue = req.body?.appointments?.[crn]?.[id]?.repeating
      const { data } = req.session
      const appointmentDate = getDataValue(data, ['appointments', crn, id, 'date'])
      const appointmentRepeatingDates = getDataValue(data, ['appointments', crn, id, 'repeatingDates'])
      const oneYearFromDate = new Date(appointmentDate)
      oneYearFromDate.setFullYear(oneYearFromDate.getFullYear() + 1)
      let finalAppointmentDate = null
      let isMoreThanAYear = false
      if (appointmentRepeatingDates) {
        finalAppointmentDate = appointmentRepeatingDates[appointmentRepeatingDates.length - 1]
        isMoreThanAYear = new Date(finalAppointmentDate) > oneYearFromDate
      }
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'repeating',
          repeatingValue,
        }),
      )
      if (isMoreThanAYear) {
        errorMessages = {
          ...errorMessages,
          [`appointments-${crn}-${id}-interval`]: 'The appointment can only repeat up to a year',
        }
      }
    }
  }

  const validateFileUpload = () => {
    const file = req?.file
    let isValid = true
    // need to refactor this so it uses validateWithSpec
    if (req.url.includes('/add-notes') && file) {
      if (!config.fileUpload.allowedMimeTypes.includes(file.mimetype)) {
        errorMessages[file.fieldname] = 'Select a valid file type'
        isValid = false
      }
      if (isValid && config.fileUpload.maxFileSize < file.size) {
        errorMessages[file.fieldname] = 'Select a file 5mb or less'
      }
    }
  }

  const validateSensitivity = () => {
    if (req.url.includes('/add-notes')) {
      const body = normaliseMultipartBody(req.body)
      errorMessages = validateWithSpec(
        body,
        appointmentsValidation({
          crn,
          id,
          page: 'add-notes',
        }),
      )
    }
  }
  let errorMessages: Record<string, string> = {}

  validateType()
  validateSentence()
  validateLocation()
  validateDateTime()
  validateRepeating()
  validateSensitivity()
  validateFileUpload()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointments
