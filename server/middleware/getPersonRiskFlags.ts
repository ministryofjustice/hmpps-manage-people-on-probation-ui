import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { PersonRiskFlags, RiskFlag, RiskScore } from '../data/model/risk'
import { setDataValue, findReplace, getStaffRisk, getProbationRisk } from '../utils'

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
    const riskToProbationStaff = getProbationRisk(personRisks.riskFlags)
    let riskToStaffLevel = riskToStaff?.levelDescription ?? riskToStaff?.level
    if (riskToStaffLevel?.toUpperCase() === 'VERY HIGH') {
      riskToStaffLevel = 'VERY_HIGH'
    }
    const level =
      riskToStaffLevel && ['VERY_HIGH', 'HIGH', 'MEDIUM'].includes(riskToStaffLevel.toUpperCase())
        ? (riskToStaffLevel.toUpperCase() as RiskScore)
        : null
    res.locals.riskToProbationStaff = riskToProbationStaff ? { id: riskToProbationStaff?.id } : undefined
    res.locals.riskToStaff = riskToStaff ? { id: riskToStaff?.id, level } : undefined
    personRisks.riskFlags = personRisks.riskFlags.map(item => {
      if (item.description === 'Risk to Probation Staff') {
        return {
          ...item,
          level: undefined,
        }
      }
      return item
    })
    res.locals.personRisks = personRisks
    return next()
  }
}
