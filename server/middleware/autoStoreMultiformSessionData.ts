import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue, unflattenBracketKeys } from '../utils'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { Data } from '../models/Data'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const autoStoreMultiformSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, _res, next) => {
    const newSessionData: Data = req?.session?.data ?? {}
    const crn: string = req.params?.crn
    // Support either ":id" or ":uuid" route params
    const id: string | undefined = (req.params as any)?.id ?? (req.params as any)?.uuid

    // Transform multipart flat body into nested structure
    const inputs: Record<string, any> = unflattenBracketKeys(req.body ?? {})

    const deleteValues = (keys: string[]): void => {
      keys.forEach(key => {
        if ((req?.session?.data?.appointments as any)?.[crn]?.[id as string]?.[key]) {
          // Ensure structure exists before deleting
          if (
            newSessionData.appointments &&
            newSessionData.appointments[crn] &&
            newSessionData.appointments[crn][id as string]
          ) {
            delete (newSessionData.appointments[crn][id as string] as any)[key as keyof AppointmentSession]
          }
        }
      })
    }

    const resetSentenceSession = () => {
      if (req.url.includes('/sentence')) {
        if (inputs?.appointments?.[crn]?.[id as string]?.licenceConditionId) {
          deleteValues(['requirementId', 'nsiId'])
        }
        if (inputs?.appointments?.[crn]?.[id as string]?.requirementId) {
          deleteValues(['licenceConditionId', 'nsiId'])
        }
        if (inputs?.appointments?.[crn]?.[id as string]?.nsiId) {
          deleteValues(['licenceConditionId', 'requirementId'])
        }
        if (
          !inputs?.appointments?.[crn]?.[id as string]?.licenceConditionId &&
          !inputs?.appointments?.[crn]?.[id as string]?.requirementId &&
          !inputs?.appointments?.[crn]?.[id as string]?.nsiId
        ) {
          deleteValues(['licenceConditionId', 'requirementId', 'nsiId'])
        }
      }
    }

    Object.entries(inputs).forEach(([key, _value]: [string, any]) => {
      if (!key.startsWith('_')) {
        const getPath = id ? [key, crn, id] : [key, crn]
        const body: Record<string, any> = getDataValue(inputs, getPath)
        if (body) {
          Object.keys(body).forEach(valueKey => {
            let newValue: any = body[valueKey]
            if (typeof newValue === 'string') {
              if (config.dateFields.includes(valueKey) && newValue.includes('/')) {
                newValue = toIsoDateFromPicker(newValue)
              }
            }
            // merge objects (e.g., nested rescheduleAppointment payloads)
            if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
              newValue = {
                ...((req?.session?.data as any)[key]?.[crn]?.[id as string]?.[valueKey] || {}),
                ...(newValue as Record<string, any>),
              }
            }
            const setPath = id ? [key, crn, id, valueKey] : [key, crn, valueKey]
            setDataValue(newSessionData, setPath, newValue as string | AppointmentType)
          })
          resetSentenceSession()
        }
      }
    })

    req.session.data = newSessionData
    return next()
  }
}

export default autoStoreMultiformSessionData
