import { Route } from '../../@types'
import { getDataValue } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { Errors } from '../../models/Errors'

interface LocalParams {
  crn: string
  id: string
  errors?: Errors
  minDate?: string
}

const appointments: Route<void> = (req, res, next) => {
  const { url, params } = req
  const { crn, id } = params
  const localParams: LocalParams = { crn, id }
  const render = `pages/${[
    url
      .split('/')
      .filter(item => item)
      .filter((_item, i) => ![0, 1, 3].includes(i))
      .join('/'),
  ]}`

  const validateType = (): void => {
    if (req.url.includes('/type')) {
      errorMessages = validateWithSpec(req.body, appointmentsValidation({ crn, id, page: 'type' }))
    }
  }

  const validateSentence = (): void => {
    if (req.url.includes('/sentence')) {
      const { data } = req.session
      const type = getDataValue(data, ['appointments', crn, id, 'type'])
      const showReveal = ['Home visit', 'Planned office visit'].includes(type)
      const sentences = req.session.data.sentences[crn]
      const sentence = sentences.find(
        (s: any) => s?.order?.description === req.body?.appointments?.[crn]?.[id]?.sentence,
      )
      const validateSentenceRequirement = showReveal && sentence?.requirements?.length > 0
      const validateSentenceLicenceCondition = showReveal && sentence?.licenceConditions?.length > 0
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'sentence',
          validateSentenceRequirement,
          validateSentenceLicenceCondition,
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
      const appointmentRepeatingDates = getDataValue(data, ['appointments', crn, id, 'repeating-dates'])
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
          [`appointments-${crn}-${id}-repeating-frequency`]: 'The appointment can only repeat up to a year',
        }
      }
    }
  }
  let errorMessages: Record<string, string> = {}
  validateType()
  validateSentence()
  validateLocation()
  validateDateTime()
  validateRepeating()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointments
