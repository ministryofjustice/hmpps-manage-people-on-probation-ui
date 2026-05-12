import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue, setDataValue } from '../../utils'

export const getContactOutcomes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, contactId, id: uuid } = req.params as Record<string, string>
    const { data } = req.session
    const id = contactId || uuid
    const path = ['appointments', crn, id]
    const type = getDataValue(data, [...path, 'type'])
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { outcomes = [], enforcementActions = [] } = await masClient.getContactOutcomes(type)
    setDataValue(data, [...path, 'outcome', 'contactOutcomes'], outcomes)
    setDataValue(data, [...path, 'outcome', 'contactEnforcementActions'], enforcementActions)
    return next()
  }
}
