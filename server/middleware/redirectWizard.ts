import { Request, Response, NextFunction } from 'express'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'
import { Route } from '../@types'
import { renderError } from './renderError'

export const redirectWizard = (
  requiredValues: (string | string[])[],
  dataPath: string[],
  redirectPath: string,
): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    const { change } = req.query
    const { data } = req.session
    if (!change) {
      for (const requiredValue of requiredValues) {
        const path = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
        const value = getDataValue(data, [...dataPath, ...path])
        if (!value) {
          if (!isValidCrn(crn) || !isValidUUID(id)) {
            return renderError(404)(req, res)
          }
          return res.redirect(redirectPath)
        }
      }
    }
    return next()
  }
}

export const redirectWizardAppointments = (requiredValues: (string | string[])[]): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    const dataPath: string[] = ['appointments', crn, id]
    const redirectPath: string = `/case/${crn}/arrange-appointment/${id}/sentence`
    const { change } = req.query
    const { data } = req.session
    if (!change) {
      for (const requiredValue of requiredValues) {
        const path = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
        const value = getDataValue(data, [...dataPath, ...path])
        if (!value) {
          if (!isValidCrn(crn) || !isValidUUID(id)) {
            return renderError(404)(req, res)
          }
          return res.redirect(redirectPath)
        }
      }
    }
    return next()
  }
}

export const redirectWizardSetupCheckIns = (requiredValues: (string | string[])[]): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    const dataPath: string[] = ['esupervision', crn, id, 'checkins']
    const redirectPath: string = `/case/${crn}/appointments/${id}/check-in/instructions`
    const { cya } = req.query
    const { data } = req.session
    if (!cya) {
      for (const requiredValue of requiredValues) {
        const path = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
        const value = getDataValue(data, [...dataPath, ...path])
        if (!value) {
          if (!isValidCrn(crn) || !isValidUUID(id)) {
            return renderError(404)(req, res)
          }
          return res.redirect(redirectPath)
        }
      }
    }
    return next()
  }
}
