import type { Request, NextFunction, RequestHandler } from 'express'
import { AppResponse } from '../models/Locals'

export const asyncMiddleware = (fn: RequestHandler) => {
  return (req: Request, res: AppResponse, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
