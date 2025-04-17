import { postcodeValidator } from 'postcode-validator'
import { DateTime } from 'luxon'
import logger from '../../logger'

export interface Validateable {
  [index: string]: string | boolean
}

export interface ErrorCheck {
  validator: (...args: any[]) => boolean
  msg: string
  length?: number
  crossField?: string
  isActive?: boolean
  log?: string
}

export interface ErrorChecks {
  optional: boolean
  checks: ErrorCheck[]
}

export interface ValidationSpec {
  [index: string]: ErrorChecks
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
  Object.entries(validationSpec).forEach(([fieldName, checks]) => {
    const formattedFieldName = fieldName.split('][').join('-').replace('[', '').replace(']', '')
    if (!request[fieldName] && checks.optional === true) {
      return
    }
    let hasProperty = false
    if (isObjectFieldName(fieldName)) {
      const keys = fieldName.slice(1, -1).split('][')
      hasProperty = hasNestedKeys(request, keys)
    } else {
      hasProperty = Object.keys(request).includes(fieldName)
    }
    if (hasProperty) {
      const error = executeValidator(checks.checks, fieldName, request)
      if (error) {
        errors[formattedFieldName] = error
      }
    } else if (checks?.optional === false) {
      errors[formattedFieldName] = checks.checks[0].msg
      if (checks?.checks?.[0]?.log) {
        logger.info(checks.checks[0].log)
      }
    }
  })
  return errors
}

function executeValidator(checks: ErrorCheck[], fieldName: string, request: Validateable) {
  for (const check of checks) {
    const { log = '' } = check
    const args: any[] = setArgs(fieldName, check, request)
    if (!check.validator(args)) {
      if (log) {
        logger.info(check.log)
      }
      return check.msg
    }
  }
  return null
}

function setArgs(fieldName: string, check: ErrorCheck, request: Validateable) {
  let value = request[fieldName]
  if (isObjectFieldName(fieldName)) {
    const path = fieldName.slice(1, -1).split('][')
    value = getNestedValue(request, path)
  }
  let args: any[] = check?.length ? [check.length, value] : [value]
  if (check?.crossField) {
    args = [request[check.crossField], value]
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
