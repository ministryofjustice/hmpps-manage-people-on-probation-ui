import { NextFunction, Request, Response } from 'express'
import { isNumericString, isValidCrn, isValidUUID } from '../utils'
import { renderError } from './renderError'

export const checkIsValidUrl = (req: Request, res: Response, next: NextFunction): void | boolean => {
  const { crn, id: uuid, contactId } = req.params as Record<string, string>
  let isValidId = false
  if (uuid) {
    isValidId = isValidUUID(uuid)
  } else if (contactId) {
    isValidId = isNumericString(contactId)
  }
  if (!isValidCrn(crn) || !isValidId) {
    return renderError(404)(req, res)
  }
  return next()
}
