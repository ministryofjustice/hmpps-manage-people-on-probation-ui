import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import { toPredictors, toRoshWidget } from '../utils'

export const getPersonalDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const arnsClient = new ArnsApiClient(token)
    const tierClient = new TierApiClient(token)
    const [overview, risks, tierCalculation, predictors] = await Promise.all([
      masClient.getPersonalDetails(crn),
      arnsClient.getRisks(crn),
      tierClient.getCalculationDetails(crn),
      arnsClient.getPredictorsAll(crn),
    ])
    req.session.data = {
      ...(req?.session?.data ?? {}),
      personalDetails: {
        ...(req?.session?.data?.personalDetails ?? {}),
        [crn]: overview,
      },
    }
    res.locals.case = req.session.data.personalDetails?.[crn]
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.tierCalculation = tierCalculation
    res.locals.predictorScores = toPredictors(predictors)
    res.locals.headerPersonName = `${overview.name.forename} ${overview.name.surname}`
    console.log(res.locals.headerPersonName)
    res.locals.headerCRN = overview.crn
    res.locals.headerDob = overview.dateOfBirth
    return next()
  }
}
