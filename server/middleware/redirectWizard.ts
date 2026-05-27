import { getDataValue } from '../utils'
import { Route } from '../@types'
import { AppResponse } from '../models/Locals'

type RouteKey = 'appointments' | 'manage' | 'setupcheckins'
type Mapping = {
  [k in RouteKey]: RedirectInfo
}

interface RedirectInfo {
  dataPath: string[]
  redirectPath: string
  queryParam: string
}

interface RequiredValuePath {
  path: string | string[] | string[][]
  value?: string | number | boolean | (string | number | boolean)[]
}

export const redirectWizard = (
  requiredValuePath: RequiredValuePath[] = null,
  routeKey: RouteKey = 'appointments',
): Route<Promise<void | AppResponse>> => {
  return async (req, res, next) => {
    const { crn, id: uuid, contactId } = req.params as Record<string, string>
    const id = uuid || contactId

    const mapping: Mapping = {
      appointments: {
        dataPath: ['appointments', crn, id],
        redirectPath: `/case/${crn}/arrange-appointment/${id}/sentence`,
        queryParam: 'change',
      },
      manage: {
        dataPath: ['appointments', crn, id],
        redirectPath: `/case/${crn}/appointments/appointment/${id}/manage`,
        queryParam: 'change',
      },
      setupcheckins: {
        dataPath: ['esupervision', crn, id, 'checkins'],
        redirectPath: `/case/${crn}/appointments/${id}/check-in/eligibility-check`,
        queryParam: 'cya',
      },
    }
    const key = id === contactId && routeKey === 'appointments' ? 'manage' : routeKey

    const { dataPath, redirectPath, queryParam } = mapping[key]
    const { data } = req.session
    let hasValidValue = true
    if (!requiredValuePath) {
      return res.status(400).send('Redirect wizard - No paths defined')
    }
    if (!req.query?.[queryParam]) {
      for (const { path: valuePath, value: requiredValue } of requiredValuePath) {
        const path = Array.isArray(valuePath) ? valuePath : [valuePath]
        if (!Array.isArray(valuePath?.[0])) {
          // if session data path is not array of paths
          const value = getDataValue(data, [...dataPath, ...path])
          if (!value) {
            hasValidValue = false
          }
          if (requiredValue) {
            const values = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
            if (!values.includes(value)) {
              hasValidValue = false
            }
          }
        } else if (Array.isArray(valuePath?.[0])) {
          const valuePaths = (path as string[] | string[][]).map(_valuePath => {
            return Array.isArray(_valuePath) ? _valuePath : [_valuePath]
          })
          if (requiredValue) {
            // if multiple paths, match value is included in any of the session data paths
            const values = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
            hasValidValue = valuePaths.some(_path => values.includes(getDataValue(data, [...dataPath, ..._path])))
          } else {
            // if multiple paths and no value to match, check that all the data paths have a value
            hasValidValue = valuePaths.some(_path => getDataValue(data, [...dataPath, ..._path]) !== undefined)
          }
        }
        if (!hasValidValue) {
          return res.redirect(redirectPath)
        }
      }
    }
    return next()
  }
}
