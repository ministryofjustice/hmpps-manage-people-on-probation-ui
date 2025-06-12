import { Request, Response, NextFunction } from 'express'
import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'
import { appointmentTypes } from '../properties'
import { AppointmentType } from '../models/Appointments'

interface Mapping {
  type: { match: 'code'; items: AppointmentType[] }
}

export const autoStoreSessionData = (req: Request, res: Response, next: NextFunction): void => {
  const newSessionData = req?.session?.data ?? {}
  const { crn, id } = req.params
  const inputs: Record<string, any> = req.body ?? {}

  const mapping: Mapping = {
    type: { match: 'code', items: res?.locals?.appointmentTypes },
  }

  type MappingKeys = keyof Mapping

  Object.entries(inputs).forEach(([key, _]: [string, any]) => {
    if (!key.startsWith('_')) {
      const getPath = id ? [key, crn, id] : [key, crn]
      const body: Record<string, string> = getDataValue(inputs, getPath)
      if (body) {
        Object.keys(body).forEach(valueKey => {
          let newValue: string | AppointmentType = body[valueKey]
          if (Object.keys(mapping).includes(valueKey)) {
            const { match, items } = mapping[valueKey as MappingKeys]
            newValue = items.find(item => item[match] === body[valueKey])
          }
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
