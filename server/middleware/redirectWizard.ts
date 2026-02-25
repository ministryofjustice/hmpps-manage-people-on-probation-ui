import { Request, Response, NextFunction } from 'express'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'
import { Route } from '../@types'
import { renderError } from './renderError'

type RouteKey = 'appointments' | 'setupcheckins'
type Mapping = {
  [k in RouteKey]: RedirectInfo
}

interface RedirectInfo {
  dataPath: string[]
  redirectPath: string
  queryParam: string
}

export const redirectWizard = (
  requiredValues: (string | string[])[],
  route: RouteKey = 'appointments',
): Route<Promise<void | null>> => {
  return async (req: Request, res: Response, next: NextFunction | undefined) => {
    const { crn, id } = req.params as Record<string, string>
    const mapping: Mapping = {
      appointments: {
        dataPath: ['appointments', crn, id],
        redirectPath: `/case/${crn}/arrange-appointment/${id}/sentence`,
        queryParam: 'change',
      },
      setupcheckins: {
        dataPath: ['esupervision', crn, id, 'checkins'],
        redirectPath: `/case/${crn}/appointments/${id}/check-in/instructions`,
        queryParam: 'cya',
      },
    }
    const { dataPath, redirectPath, queryParam } = mapping[route]
    const { data } = req.session
    if (!req.query?.[queryParam]) {
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
    if (next) {
      return next()
    }
    return null
  }
}
