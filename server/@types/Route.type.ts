import { Request, NextFunction } from 'express'
import { AppResponse } from '../models/Locals'

export type Route<T, TArgs = unknown> = (req: Request, res: AppResponse, next?: NextFunction, args?: TArgs) => T
