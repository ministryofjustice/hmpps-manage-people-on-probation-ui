import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../types/Route'
import { PersonRiskFlags } from '../data/model/risk'
import { setDataValue } from '../utils'
import { Data } from '../models/Data'

export const getPersonRiskFlags = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async (req, res, next) => {
    const { crn } = req.params as Record<string, string>
    let personRisks: PersonRiskFlags
    if (!req.session?.data?.risks?.[crn]) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      personRisks = await masClient.getPersonRiskFlags(crn)
      const { data } = req.session
      setDataValue(data as Data, ['risks', crn], personRisks)
    } else {
      personRisks = req.session.data.risks[crn]
    }
    res.locals.personRisks = personRisks
    if (next) {
      return next()
    }
    return null
  }
}
