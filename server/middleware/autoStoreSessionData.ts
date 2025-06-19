import { Request, Response, NextFunction } from 'express'
import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'

export const autoStoreSessionData = (req: Request, res: Response, next: NextFunction): void => {
  const newSessionData = req?.session?.data ?? {}
  const { crn, id } = req.params
  const inputs: Record<string, any> = req.body ?? {}
  Object.entries(inputs).forEach(([key, _]: [string, any]) => {
    if (!key.startsWith('_')) {
      const getPath = id ? [key, crn, id] : [key, crn]
      const body: Record<string, string> = getDataValue(inputs, getPath)
      if (body !== undefined) {
        Object.keys(body).forEach(valueKey => {
          let newValue = body[valueKey]
          if (config.dateFields.includes(valueKey) && body[valueKey].includes('/')) {
            newValue = toIsoDateFromPicker(body[valueKey])
          }
          const setPath = id ? [key, crn, id, valueKey] : [key, crn, valueKey]
          setDataValue(newSessionData, setPath, newValue)
        })
      }
    }
  })
  req.session.data = newSessionData
  return next()
}
