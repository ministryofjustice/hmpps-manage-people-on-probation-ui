import { Request } from 'express'
import { postcodeValidator } from 'postcode-validator'
import { DateTime } from 'luxon'
import logger from '../../logger'
import { dateTime } from './dateTime'
import { ErrorCheck, ValidationSpec } from '../models/Errors'
import config from '../config'

export const isEmail = (string: string) => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(string)
export const hasAllDigits = (string: string) => /^\d+$/.test(string)
export const isValidFileName = (string: string) => !/[!|$%&<>:?*#"/\\^]/.test(string)

export const isNotEmpty = (args: any[]) => {
  return !!args[0] && args[0] !== undefined
}
export const contactPrefEmailCheck = (args: any[]) => {
  if (!args[0] || args[0] === 'PHONE') {
    return true
  }
  return args[0] === 'EMAIL' && isEmail(args[1])
}

export const contactPrefMobileCheck = (args: any[]) => {
  if (!args[0] || args[0] === 'EMAIL') {
    return true
  }
  return args[0] === 'PHONE' && isValidMobileNumber(args[1])
}

export const isNumeric = (args: any[]) => /^[\d ]+$/.test(args[0])
export const isUkPostcode = (args: any[]) => {
  return postcodeValidator(args[0], 'GB')
}
export const charsOrLess = (args: any[]) => {
  return !args[1] || args[1].length <= args[0]
}
export const isValidDate = (args: any[]) => {
  return !!args[0] && DateTime.fromFormat(args[0], 'd/M/yyyy').isValid
}
export const isValidDateFormat = (args: any[]): boolean => {
  const regex = /^[1-9]?\d\/[1-9]?\d\/\d{4}$/
  return regex.test(args[0])
}
export const isStringNumber = (args: any[]): boolean => {
  return !Number.isNaN(parseInt(args[0], 10))
}
export const isNotLaterThanToday = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const date = DateTime.fromFormat(args[0], 'd/M/yyyy')
  return date.isValid && date <= DateTime.now()
}

export const isTodayOrLater = (args: any[]) => {
  if (!args[0]) {
    return false
  }
  const date = DateTime.fromFormat(args[0], 'd/M/yyyy')
  if (!date.isValid) {
    return false
  }

  return date.startOf('day') >= DateTime.now().startOf('day')
}

export const isFutureDate = (args: any[]) => {
  if (!args[0]) return false

  const date = DateTime.fromFormat(args[0], 'd/M/yyyy', { zone: 'utc' })
  if (!date.isValid) return false

  const now = DateTime.utc().startOf('day')
  return date.startOf('day') > now
}
export const timeIsNotEarlierThan = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const dateNow = DateTime.now().toSQLDate()
  const notEarlierThanTime = DateTime.fromJSDate(dateTime(dateNow, args[0]))
  const date = DateTime.fromJSDate(dateTime(dateNow, args[1]))
  if (!notEarlierThanTime || !date.isValid) {
    return true
  }
  return notEarlierThanTime > date
}
export const timeIsValid24HourFormat = (args: any[]): boolean => {
  if (!args[1]) {
    return false
  }
  const timeStr = args[1]
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/
  return regex.test(timeStr)
}

export const timeIsNowOrInFuture = (args: any[], mockDateToOverride?: DateTime) => {
  if (!args[0] || !args[1]) {
    return false
  }
  const [dateStr, timeStr] = args
  const date = DateTime.fromFormat(dateStr, 'd/M/yyyy')
  if (date.isValid) {
    const time = DateTime.fromFormat(timeStr.toUpperCase(), 'HH:mm')
    const dateAndTime = date.set({
      hour: time.hour,
      minute: time.minute,
      second: 0,
      millisecond: 0,
    })
    const now = mockDateToOverride || DateTime.now()
    return dateAndTime >= now
  }
  return true
}

export const isNotEarlierThan = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const notEarlierThanDate = DateTime.fromFormat(args[0], 'd/M/yyyy')
  const date = DateTime.fromFormat(args[1], 'd/M/yyyy')
  if (!notEarlierThanDate.isValid || !date.isValid) {
    return true
  }
  return notEarlierThanDate >= date
}

export const isNotLaterThan = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const notLaterThanDate = DateTime.fromFormat(args[0], 'd/M/yyyy')
  const date = DateTime.fromFormat(args[1], 'd/M/yyyy')
  if (!notLaterThanDate.isValid || !date.isValid) {
    return true
  }
  return notLaterThanDate <= date
}

export const timeIsNotLaterThan = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const dateNow = DateTime.now().toSQLDate()
  const notLaterThanDate = DateTime.fromJSDate(dateTime(dateNow, args[0]))
  const date = DateTime.fromJSDate(dateTime(dateNow, args[1]))
  if (!notLaterThanDate.isValid || !date.isValid) {
    return true
  }
  return notLaterThanDate < date
}

export const isValidRescheduledDateTime = (_args: any[], _now: DateTime, request: Request) => {
  const { crn, id } = request.params as Record<string, string>
  const date = request.body?.appointments?.[crn]?.[id]?.date
  const start = request.body?.appointments?.[crn]?.[id]?.start
  const end = request.body?.appointments?.[crn]?.[id]?.end
  const previousStart = request?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment?.previousStart
  const previousEnd = request?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment?.previousEnd
  if (date && start && end && previousStart && previousEnd) {
    const startDT = DateTime.fromFormat(`${date} ${start}`, 'd/M/yyyy HH:mm', { zone: 'Europe/London' })
    const endDT = DateTime.fromFormat(`${date} ${end}`, 'd/M/yyyy HH:mm', { zone: 'Europe/London' })
    const prevStartDT = DateTime.fromISO(previousStart).set({ millisecond: 0 })
    const prevEndDT = DateTime.fromISO(previousEnd).set({ millisecond: 0 })
    if (startDT.toMillis() === prevStartDT.toMillis() && endDT.toMillis() === prevEndDT.toMillis()) {
      return false
    }
  }
  return true
}

export const isValidCharCount = (args: any[]) => {
  const value = args?.[0]
  const { maxCharCount } = config
  if (!value) {
    return true
  }
  const lineBreaks = value.split('\r\n').length - 1
  const textLength = value.split('\r\n').join('').length
  return value.trim() !== '' && textLength + lineBreaks <= maxCharCount
}

export const isValidMobileNumber = (input: string) => {
  const value = typeof input === 'string' ? input : String(input ?? '')
  return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(value.trim())
}

export function validateWithSpec(request: Request, validationSpec: ValidationSpec, mocks: { now?: DateTime } = {}) {
  const errors: Record<string, string> = {}
  Object.entries(validationSpec).forEach(([fieldName, checks]) => {
    const formattedFieldName = fieldName.split('][').join('-').replace('[', '').replace(']', '')
    if (checks.mandatoryWhenFieldSet && !request?.body?.[fieldName] && request?.body?.[checks.mandatoryWhenFieldSet]) {
      errors[fieldName] = checks.mandatoryMsg
      return
    }
    if (!request?.body?.[fieldName] && checks.optional === true) {
      return
    }
    let hasProperty: boolean
    if (isObjectFieldName(fieldName)) {
      const keys = fieldName.slice(1, -1).split('][')
      hasProperty = hasNestedKeys(request.body, keys)
    } else {
      hasProperty = Object.keys(request.body).includes(fieldName)
    }
    if (hasProperty) {
      const error = executeValidator(checks.checks, fieldName, request, mocks)
      if (error) {
        errors[formattedFieldName] = error
      }
    } else if (checks?.optional === false) {
      errors[formattedFieldName] = Array.isArray(checks.checks[0].msg) ? checks.checks[0].msg[0] : checks.checks[0].msg
      if (checks?.checks?.[0]?.log) {
        logger.info(checks.checks[0].log)
      }
    }
  })
  return errors
}

function executeValidator(checks: ErrorCheck[], fieldName: string, request: Request, mocks: { now?: DateTime }) {
  for (const check of checks) {
    const { log = '' } = check
    const args: any[] = setArgs(fieldName, check, request)
    if (!check.validator(args, mocks.now, request)) {
      if (log) {
        logger.info(check.log)
      }
      return check.msg
    }
  }
  return null
}

function setArgs(fieldName: string, check: ErrorCheck, request: Request) {
  let value = request?.body?.[fieldName]
  if (isObjectFieldName(fieldName)) {
    const path = fieldName.slice(1, -1).split('][')
    value = getNestedValue(request.body, path)
  }
  let args: any[] = check?.length ? [check.length, value] : [value]
  if (check?.crossField) {
    args = [
      isObjectFieldName(check?.crossField)
        ? getNestedValue(request.body, check?.crossField.slice(1, -1).split(']['))
        : request?.body?.[check.crossField],
      isObjectFieldName(fieldName)
        ? getNestedValue(request.body, fieldName.slice(1, -1).split(']['))
        : request?.body?.[fieldName],
    ]
  }
  return args
}

const isObjectFieldName = (fieldName: string): boolean => fieldName.includes('[') && fieldName.includes(']')

export const getNestedValue = (obj: any, keys: string[]): any => {
  let current = obj
  for (const key of keys) {
    current = current?.[key]
  }
  return current
}

export const hasNestedKeys = (obj: any, keys: string[]): boolean => {
  return (
    keys.reduce((acc, key) => {
      if (acc && typeof acc === 'object' && key in acc) {
        return acc[key]
      }
      return undefined
    }, obj) !== undefined
  )
}
