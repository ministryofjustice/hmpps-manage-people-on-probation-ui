import { postcodeValidator } from 'postcode-validator'
import { DateTime } from 'luxon'

export interface Validateable {
  [index: string]: string | boolean
}

export interface ErrorCheck {
  validator: (...args: any[]) => boolean
  msg: string
  length?: number
  crossField?: string
}

export interface ErrorChecks {
  optional: boolean
  checks: ErrorCheck[]
}

export interface ValidationSpec {
  [index: string]: ErrorChecks
}

const getIsoDate = (date: string): DateTime => {
  const [day, month, year] = date.split('/')
  return DateTime.fromISO(DateTime.local(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)).toISODate())
}

export const isEmail = (string: string) => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(string)
export const isNotEmpty = (args: any[]) => {
  return !!args[0] && args[0] !== undefined
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
export const isNotLaterThanAYear = (args: any[]) => {
  const currentDate = args?.[1] || DateTime.now()
  const date = DateTime.fromFormat(currentDate, 'd/M/yyyy')
  const oneYearFromDate = date.plus({ years: 1 })
  return date < oneYearFromDate
}
export const isNotLaterThanToday = (args: any[]) => {
  if (!args[0]) {
    return true
  }
  const date = DateTime.fromFormat(args[0], 'd/M/yyyy')
  return date.isValid && date <= DateTime.now()
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

export function validateWithSpec<R extends Validateable>(request: R, validationSpec: ValidationSpec) {
  const errors: Record<string, string> = {}
  Object.entries(validationSpec).forEach(entry => {
    const fieldName = entry[0]
    const checks = entry[1]
    if (!request[fieldName] && checks.optional === true) {
      return
    }
    if (Object.prototype.hasOwnProperty.call(request, fieldName)) {
      const error = executeValidator(checks.checks, fieldName, request)
      if (error) errors[fieldName] = error
    } else if (checks.optional === false) {
      errors[fieldName] = checks.checks[0].msg
    }
  })
  return errors
}

function executeValidator(checks: ErrorCheck[], fieldName: string, request: Validateable) {
  for (const check of checks) {
    const args: any[] = setArgs(fieldName, check, request)
    if (!check.validator(args)) {
      return check.msg
    }
  }
  return null
}

function setArgs(fieldName: string, check: ErrorCheck, request: Validateable) {
  let args: any[] = check?.length ? [check.length, request[fieldName]] : [request[fieldName]]
  if (check?.crossField) {
    args = [request[check.crossField], request[fieldName]]
  }
  return args
}
