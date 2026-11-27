import { MPoPComponents, toPersonRiskDetails } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { PersonRiskFlags } from '../data/model/risk'
import { setDataValue } from '../utils'

const riskFlagsUnavailable = {
  errors: [{ text: 'Risk flag information is currently unavailable. Try again later or use NDelius.' }],
} as unknown as PersonRiskFlags

export const getPersonRiskFlags = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  return async function getPersonRiskFlagsInner(req, res, next) {
    const { crn } = req.params as Record<string, string>
    const legacyRiskBadgeData = req.session?.data?.riskBadgeData
    const isLegacyCache = Boolean(legacyRiskBadgeData?.[crn])
    let personRiskFlags = isLegacyCache ? undefined : req.session?.data?.risks?.[crn]

    if (!personRiskFlags) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const response = await mpopComponents.getPersonRiskFlags(token, crn)
      if (response.error) {
        if (response.httpStatus !== 500) {
          throw response.error
        }
        res.locals.personRisks = riskFlagsUnavailable
        return next()
      }
      personRiskFlags = response.personRiskFlags as PersonRiskFlags
      setDataValue(req.session.data, ['risks', crn], personRiskFlags)
      if (isLegacyCache) {
        delete legacyRiskBadgeData[crn]
      }
    }

    const { personRisks, riskBadgeData, riskToStaff, riskToProbationStaff, rosh } = toPersonRiskDetails(personRiskFlags)

    res.locals.riskToProbationStaff = riskToProbationStaff
    res.locals.riskToStaff = riskToStaff
    if (res.locals?.flags?.enableNDeliusRosh) {
      res.locals.rosh = rosh
    }
    res.locals.personRisks = personRisks as PersonRiskFlags
    res.locals.riskBadgeData = riskBadgeData

    return next()
  }
}
