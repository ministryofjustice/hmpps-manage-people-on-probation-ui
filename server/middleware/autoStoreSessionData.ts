import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { Data } from '../models/Data'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const autoStoreSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, _res, next) => {
    const newSessionData: Data = req?.session?.data ?? {}
    const { crn, id } = req.params
    const inputs: Record<string, any> = req.body ?? {}

    const deleteValues = (keys: string[]): void => {
      keys.forEach(key => {
        if ((req?.session?.data?.appointments as any)?.[crn]?.[id]?.[key]) {
          delete newSessionData.appointments[crn][id][key as keyof AppointmentSession]
        }
      })
    }

    const resetSentenceSession = () => {
      if (req.url.includes('/sentence')) {
        if (req?.body?.appointments?.[crn]?.[id]?.licenceConditionId) {
          deleteValues(['requirementId', 'nsiId'])
        }
        if (req?.body?.appointments?.[crn]?.[id]?.requirementId) {
          deleteValues(['licenceConditionId', 'nsiId'])
        }
        if (req?.body?.appointments?.[crn]?.[id]?.nsiId) {
          deleteValues(['licenceConditionId', 'requirementId'])
        }
        if (
          !req?.body?.appointments?.[crn]?.[id]?.licenceConditionId &&
          !req?.body?.appointments?.[crn]?.[id]?.requirementId &&
          !req?.body?.appointments?.[crn]?.[id]?.nsiId
        ) {
          deleteValues(['licenceConditionId', 'requirementId', 'nsiId'])
        }
      }
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
          resetSentenceSession()
        }
      }
    })
    req.session.data = newSessionData
    return next()
  }
}
