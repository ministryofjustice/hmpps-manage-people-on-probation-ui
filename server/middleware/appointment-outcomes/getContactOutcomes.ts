import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { ContactEnforcementActions, ContactOutcomes } from '../../data/model/schedule'
import { AppointmentSession } from '../../models/Appointments'
import { getDataValue, setDataValue } from '../../utils'

export const getContactOutcomes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, contactId, id: uuid } = req.params as Record<string, string>
    const { data } = req.session
    const id = contactId || uuid
    const path = ['appointments', crn, id]
    const appointment = getDataValue<AppointmentSession>(data, [...path])
    const type = appointment?.type
    const outcome = appointment?.outcome
    let contactOutcomes: ContactOutcomes[] = []
    let contactEnforcementActions: ContactEnforcementActions[] = []
    if (type) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      ;({ outcomes: contactOutcomes = [], enforcementActions: contactEnforcementActions = [] } =
        await masClient.getContactOutcomes(type))
    }
    setDataValue(data, [...path, 'outcome'], {
      ...outcome,
      contactOutcomes,
      contactEnforcementActions,
    })
    return next()
  }
}
