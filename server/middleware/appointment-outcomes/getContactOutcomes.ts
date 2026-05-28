import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { ContactOutcome } from '../../data/model/schedule'
import { AppointmentSession } from '../../models/Appointments'
import { getDataValue, setDataValue } from '../../utils'

export const setContactOutcomes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, contactId, id: uuid } = req.params as Record<string, string>
    const { data } = req.session
    const id = contactId || uuid
    const path = ['appointments', crn, id]
    const appointment = getDataValue<AppointmentSession>(data, [...path])
    const outcome = appointment?.outcome || {}
    const type = appointment?.type
    let contactOutcomes: ContactOutcome[] = []
    if (type) {
      contactOutcomes = await getContactOutcomes(type, hmppsAuthClient)(req, res)
    }
    setDataValue(data, [...path, 'outcome'], {
      ...outcome,
      contactOutcomes,
    })
    return next()
  }
}

export const getContactOutcomes = (
  type: string,
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<ContactOutcome[]>> => {
  return async (_req, res) => {
    let contactOutcomes: ContactOutcome[] = []
    if (type) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      ;({ outcomes: contactOutcomes = [] } = await masClient.getContactOutcomes(type))
    }
    return contactOutcomes
  }
}
