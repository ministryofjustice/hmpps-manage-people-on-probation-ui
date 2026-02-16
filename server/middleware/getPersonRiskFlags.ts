import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { PersonRiskFlags, Risk, RiskFlag, RiskScore } from '../data/model/risk'
import { setDataValue, findReplace, getStaffRisk } from '../utils'

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
    const riskToStaff = getStaffRisk(personRisks.riskFlags)
    const riskToStaffLevel = riskToStaff?.levelDescription ?? riskToStaff?.level
    const level =
      riskToStaffLevel && ['VERY HIGH', 'VERY_HIGH', 'HIGH', 'MEDIUM'].includes(riskToStaffLevel.toUpperCase())
        ? (riskToStaffLevel.toUpperCase() as RiskScore)
        : null
    res.locals.riskToStaff = { id: riskToStaff?.id, level }
    res.locals.personRisks = personRisks
    return next()
  }
}
