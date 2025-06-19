import { DateTime } from 'luxon'
import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'
import { AppointmentType } from '../models/Appointments'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const autoStoreSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, _res, next) => {
    const newSessionData = req?.session?.data ?? {}
    const { crn, id } = req.params
    const inputs: Record<string, any> = req.body ?? {}

    const resetValues = (keys: Record<string, string | string[]>): void => {
      Object.entries(keys).forEach(([key, value]) => {
        if ((req?.session?.data?.appointments as any)?.[crn]?.[id]?.[key]) {
          setDataValue(newSessionData, ['appointments', crn, id, key], value)
        }
      })
    }

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
            if (typeof newValue === 'object') {
              newValue = {
                ...((req?.session?.data as any)[key]?.[crn]?.[id]?.[valueKey] || {}),
                ...(newValue as Record<string, string>),
              }
            }
            const setPath = id ? [key, crn, id, valueKey] : [key, crn, valueKey]
            setDataValue(newSessionData, setPath, newValue)
          })
          if (req?.body?.appointments?.[crn]?.[id]?.repeating === 'No') {
            resetValues({ numberOfAppointments: '', interval: '', repeatingDates: [] })
          }
          if (req?.body?.appointments?.[crn]?.[id]?.licenceConditionId) {
            resetValues({ requirementId: '', nsiId: '' })
          }
          if (req?.body?.appointments?.[crn]?.[id]?.requirementId) {
            resetValues({ licenceConditionId: '', nsiId: '' })
          }
          if (req?.body?.appointments?.[crn]?.[id]?.nsiId) {
            resetValues({ licenceConditionId: '', requirementId: '' })
          }
        }
      }
    })
    req.session.data = newSessionData
    return next()
  }
}
