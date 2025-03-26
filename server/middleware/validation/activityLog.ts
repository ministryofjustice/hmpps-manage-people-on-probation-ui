import { DateTime } from 'luxon'
import logger from '../../../logger'
import { Errors, Route } from '../../@types'
import { errorMessages } from '../../properties'
import utils from '../../utils'
import { toCamelCase } from '../../utils/utils'

const activityLog: Route<void> = (req, res, next): void => {
  const { dateFrom, dateTo } = req.body
  const { url, body } = req
  const { submit } = body
  const isValid: { [key: string]: boolean } = {
    dateFrom: true,
    dateTo: true,
  }

  const getIsoDate = (date: string): DateTime => {
    const [day, month, year] = date.split('/')
    return DateTime.fromISO(DateTime.local(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)).toISODate())
  }

  const isValidDateFormat = (nameProp: string, dateVal: string): void => {
    const regex = /^[1-9]?\d\/[1-9]?\d\/\d{4}$/
    if (dateVal && !regex.test(dateVal)) {
      const text = errorMessages['activity-log'][nameProp].errors.isInvalid
      const name = toCamelCase(nameProp)
      errors = utils.addError(errors, { text, anchor: name })
      isValid[name] = false
    }
  }

  const isRealDate = (nameProp: string, dateVal: string): void => {
    const name = toCamelCase(nameProp)
    if (isValid[name] && req?.body?.[name]) {
      const dateToIso = getIsoDate(dateVal)
      if (!dateToIso.isValid) {
        const text = errorMessages['activity-log'][nameProp].errors.isNotReal
        errors = utils.addError(errors, { text, anchor: name })
        isValid[name] = false
      }
    }
  }

  const isDateInFuture = (nameProp: string, dateVal: string): void => {
    const name = toCamelCase(nameProp)
    if (isValid[name] && req?.body?.[name]) {
      const dateFromIso = getIsoDate(dateVal)
      const today = DateTime.now()
      if (dateFromIso > today) {
        const text = errorMessages['activity-log'][nameProp].errors.isInFuture
        errors = utils.addError(errors, { text, anchor: name })
        isValid[name] = false
      }
    }
  }

  const dateIsValid = (dateName: string): boolean => req?.body?.[dateName] && isValid[dateName]

  const validateDateRanges = (): void => {
    isValidDateFormat('date-from', dateFrom)
    isRealDate('date-from', dateFrom)
    isDateInFuture('date-from', dateFrom)
    isValidDateFormat('date-to', dateTo)
    isRealDate('date-to', dateTo)
    if (dateIsValid('dateTo')) {
      isDateInFuture('date-to', dateTo)
    }
    if (!dateFrom && dateIsValid('dateTo')) {
      logger.info(errorMessages['activity-log']['date-from'].log)
      const text = errorMessages['activity-log']['date-from'].errors.isEmpty
      errors = utils.addError(errors, { text, anchor: 'dateFrom' })
      isValid.dateFrom = false
    }
    if (!dateTo && dateIsValid('dateFrom')) {
      logger.info(errorMessages['activity-log']['date-to'].log)
      const text = errorMessages['activity-log']['date-to'].errors.isEmpty
      errors = utils.addError(errors, { text, anchor: 'dateTo' })
      isValid.dateTo = false
    }
    if (dateIsValid('dateFrom') && dateIsValid('dateTo')) {
      const dateFromIso = getIsoDate(dateFrom)
      const dateToIso = getIsoDate(dateTo)
      if (dateFromIso > dateToIso) {
        const text = errorMessages['activity-log']['date-from'].errors.isAfterTo
        errors = utils.addError(errors, { text, anchor: 'dateFrom' })
        isValid.dateFrom = false
      }
    }
  }

  let errors: Errors = null
  if (submit) {
    if (req?.session?.errors) {
      delete req.session.errors
    }

    validateDateRanges()
    if (errors) {
      req.session.errors = errors
      return res.redirect(url.replace('&submit=true', ''))
    }
  }
  return next()
}

export default activityLog
