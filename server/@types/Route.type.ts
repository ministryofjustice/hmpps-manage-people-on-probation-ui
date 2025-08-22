import { Request, NextFunction } from 'express'

import { AppResponse } from '../models/Locals'

export type Route<T, TArgs = any> = (req: Request, res: AppResponse, next?: NextFunction, args?: TArgs) => T
