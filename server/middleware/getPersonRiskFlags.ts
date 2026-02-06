import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { PersonRiskFlags, RiskFlag } from '../data/model/risk'
import { setDataValue, findReplace } from '../utils'

export const getPersonRiskFlags = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    let personRisks: PersonRiskFlags
    if (!req.session?.data?.risks?.[crn]) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      personRisks = await masClient.getPersonRiskFlags(crn)
      const term = 'RoSH'
      ;['riskFlags', 'removedRiskFlags'].forEach(path => {
        personRisks = findReplace<PersonRiskFlags, RiskFlag>({
          data: personRisks,
          path: [path],
          key: 'description',
          find: term,
          replace: term.toUpperCase(),
        })
      })
      const { data } = req.session
      setDataValue(data, ['risks', crn], personRisks)
    } else {
      personRisks = req.session.data.risks[crn]
    }
    res.locals.personRisks = personRisks
    return next()
  }
}
