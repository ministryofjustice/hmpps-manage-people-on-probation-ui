import { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'
import { unflattenBracketKeys } from '../utils/unflattenBracketKeys'

export const parseMultipartBody = (req: Request, res: AppResponse, next: NextFunction): void => {
  req.body = unflattenBracketKeys(req.body)
  return next()
}
