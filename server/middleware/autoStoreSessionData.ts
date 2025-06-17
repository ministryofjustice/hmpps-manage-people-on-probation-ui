import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'
import { AppointmentType } from '../models/Appointments'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const autoStoreSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<void> => {
  return async (req, _res, next) => {
    const newSessionData = req?.session?.data ?? {}
    const { crn, id } = req.params
    const inputs: Record<string, any> = req.body ?? {}
    Object.entries(inputs).forEach(([key, _]: [string, any]) => {
      if (!key.startsWith('_')) {
        const getPath = id ? [key, crn, id] : [key, crn]
        const body: Record<string, string> = getDataValue(inputs, getPath)
        if (body) {
          Object.keys(body).forEach(valueKey => {
            let newValue: string | AppointmentType = body[valueKey]
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
}
