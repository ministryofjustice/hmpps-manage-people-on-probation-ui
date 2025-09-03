import { Request, NextFunction } from 'express'

// eslint-disable-next-line import/no-cycle
import { AppResponse } from '../models/Locals'

export type Route<T, TArgs = any> = (req: Request, res: AppResponse, next?: NextFunction, args?: TArgs) => T
