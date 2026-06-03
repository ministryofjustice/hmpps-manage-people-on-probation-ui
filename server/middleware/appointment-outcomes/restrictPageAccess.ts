import { NextFunction, Request, Response } from 'express'
import { getDataValue } from '../../utils'
import {
  pageAccessRules,
  anyValue,
  type PageAccessRuleItem,
} from '../../properties/appointment-outcomes/page-access-rules'

export const restrictPageAccess = (req: Request, res: Response, next: NextFunction) => {
  const { url, session, params } = req
  const { crn, id: uuid, contactId } = params
  const id = uuid || contactId
  const { data } = session
  const path = ['appointments', crn, id]
  const appointmentSession = getDataValue(data, path)
  const baseUrl = uuid
    ? `/case/${crn}/arrange-appointment/${uuid}`
    : `/case/${crn}/appointments/appointment/${contactId}`
  const originUrl = uuid ? `${baseUrl}/sentence` : `${baseUrl}/manage`
  const outcomeUrl = `${baseUrl}/outcome`

  if (!appointmentSession?.date) {
    return res.redirect(originUrl)
  }

  if (url.includes('/confirmation') && !appointmentSession) {
    return res.redirect(originUrl)
  }

  let restricted = false

  const checkRequiredValue = (key: keyof PageAccessRuleItem, value: string): boolean => {
    const keys = key.split('.')
    const sessionValue = getDataValue(data, [...path, ...keys])
    const hasValue = sessionValue !== undefined && sessionValue !== null && sessionValue !== ''

    if (value === anyValue) {
      return !hasValue
    }

    return sessionValue !== value
  }

  const checkPageAccessRules = (rules: PageAccessRuleItem[]): boolean => {
    for (const rule of rules) {
      let isInvalidRule = false
      for (const [key, value] of Object.entries(rule) as [keyof PageAccessRuleItem, string][]) {
        if (checkRequiredValue(key, value)) {
          isInvalidRule = true
          break
        }
      }
      if (!isInvalidRule) {
        return false
      }
    }
    return true
  }

  for (const rule of pageAccessRules) {
    if (url.includes(`outcome/${rule.url}`)) {
      if (rule?.required) {
        for (const [key, value] of Object.entries(rule.required) as [keyof PageAccessRuleItem, string][]) {
          restricted = checkRequiredValue(key, value)
        }
      }
      if (rule?.oneRequired && !restricted) {
        restricted = checkPageAccessRules(rule.oneRequired)
      }
    }
  }
  if (restricted) {
    return res.redirect(outcomeUrl)
  }
  return next()
}
