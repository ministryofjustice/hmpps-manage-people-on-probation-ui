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
  restartPath: string
  queryParam: string
}

type PageRoute = 'appointments' | 'setupcheckins'

export const restrictPageAccess = ({
  requiredValues = [],
  route = 'appointments',
}: { requiredValues?: (string | string[])[]; route?: PageRoute } = {}): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params as Record<string, string>

    const mapping: Mapping = {
      appointments: {
        dataPath: ['appointments', crn, id],
        redirectPath: `/case/${crn}/arrange-appointment/${id}/sentence`,
        restartPath: `/case/${crn}/arrange-appointment/sentence`,
        queryParam: 'change',
      },
      setupcheckins: {
        dataPath: ['esupervision', crn, id, 'checkins'],
        redirectPath: `/case/${crn}/appointments/${id}/check-in/eligibility-check`,
        restartPath: `/case/${crn}/appointments/check-in/eligibility-check`,
        queryParam: 'cya',
      },
    }
    const { dataPath, redirectPath, restartPath, queryParam } = mapping[route]
    const { data } = req.session
    if (!isValidCrn(crn) || !isValidUUID(id)) {
      return renderError(404)(req, res)
    }
    if (getDataValue(data, [...dataPath]) === undefined) {
      return res.redirect(restartPath)
    }
    if (!req.query?.[queryParam]) {
      for (const requiredValue of requiredValues) {
        const path = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
        const value = getDataValue(data, [...dataPath, ...path])
        if (!value) {
          return res.redirect(redirectPath)
        }
      }
    }
    return next()
  }
}
