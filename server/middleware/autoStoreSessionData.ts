import { Request, Response, NextFunction } from 'express'
import config from '../config'
import { getDataValue, setDataValue, toISODate } from '../utils/utils'

export const autoStoreSessionData = (req: Request, res: Response, next: NextFunction): void => {
  const newSessionData = req?.session?.data || {}
  const { crn, id } = req.params
  const inputs: Record<string, any> = req.body
  Object.entries(inputs).forEach(([key, val]: [string, any]) => {
    if (!key.startsWith('_')) {
      const getPath = id ? [key, crn, id] : [key, crn]
      const body: Record<string, string> = getDataValue(inputs, getPath)
      Object.keys(body).forEach(valueKey => {
        let newValue = body[valueKey]
        if (config.dateFields.includes(valueKey) && body[valueKey].includes('/')) {
          newValue = toISODate(body[valueKey])
        }
        const setPath = id ? [key, crn, id, valueKey] : [key, crn, valueKey]
        setDataValue(newSessionData, setPath, newValue)
      })
    }
  })
  req.session.data = newSessionData
  return next()
}
