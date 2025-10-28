import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import SentencePlanApiClient from '../data/sentencePlanApiClient'
import { toPredictors, toRoshWidget } from '../utils'
import { SentencePlan } from '../models/Risk'
import logger from '../../logger'

export const getPersonalDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    const { username } = res.locals.user
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const arnsClient = new ArnsApiClient(token)
    const tierClient = new TierApiClient(token)
    const sentencePlanClient = new SentencePlanApiClient(token)
    const [overview, risks, tierCalculation, predictors, userCaseload] = await Promise.all([
      masClient.getPersonalDetails(crn),
      arnsClient.getRisks(crn),
      tierClient.getCalculationDetails(crn),
      arnsClient.getPredictorsAll(crn),
      masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
    ])
    const popInUsersCaseload = userCaseload?.caseload?.[0]?.crn === crn
    const sentencePlan: SentencePlan = { showLink: false, lastUpdatedDate: '' }
    if (res.locals?.user?.roles?.includes('SENTENCE_PLAN')) {
      try {
        const sentencePlans = await sentencePlanClient.getPlanByCrn(crn)
        sentencePlan.showLink =
          res.locals.flags.enableSentencePlan && sentencePlans?.[0] !== undefined && popInUsersCaseload

        if (sentencePlan.showLink && sentencePlans[0]?.lastUpdatedDate)
          sentencePlan.lastUpdatedDate = sentencePlans[0].lastUpdatedDate
      } catch (error) {
        logger.error(error, 'Failed to connect to sentence plan service.')
      }
    }
    req.session.data = {
      ...(req?.session?.data ?? {}),
      personalDetails: {
        ...(req?.session?.data?.personalDetails ?? {}),
        [crn]: overview,
      },
    }
    res.locals.sentencePlan = sentencePlan
    res.locals.case = req.session.data.personalDetails?.[crn]
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.tierCalculation = tierCalculation
    res.locals.predictorScores = toPredictors(predictors)
    res.locals.headerPersonName = `${overview.name.forename} ${overview.name.surname}`
    res.locals.headerCRN = overview.crn
    res.locals.headerDob = overview.dateOfBirth
    return next()
  }
}
