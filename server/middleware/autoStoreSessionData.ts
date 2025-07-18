import crypto from 'crypto'
import config from '../config'
import { toIsoDateFromPicker, getDataValue, setDataValue } from '../utils'
import { AppointmentType } from '../models/Appointments'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

const encryptFile = async (plainText: Buffer) => {
  const key = crypto.randomBytes(32) // 256 bits for AES-256
  const iv = crypto.randomBytes(12) // 96 bits recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([encrypted, authTag])
}

export const autoStoreSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, _res, next) => {
    const newSessionData = req?.session?.data ?? {}
    const { crn, id } = req.params
    const inputs: Record<string, any> = req.body ?? {}
    // if file, encrypt it and save to session as Base64 string - should not be used for large files
    if (req?.file) {
      const { fieldname, originalname, mimetype, buffer } = req.file
      const encryptedBuffer = await encryptFile(buffer)
      setDataValue(newSessionData, ['appointments', crn, id, fieldname], {
        originalname,
        mimetype,
        buffer: encryptedBuffer.toString('base64'),
      })
    }
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
    // if (req.session.data.appointments[crn][id]?.file?.buffer) {
    //   console.log(`-------------- Buffer saved to session ----------------`)
    //   console.log(req.session.data.appointments[crn][id].file.buffer)
    // }

    return next()
  }
}
