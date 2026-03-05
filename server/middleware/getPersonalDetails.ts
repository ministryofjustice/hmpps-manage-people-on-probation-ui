/* eslint-disable import/no-extraneous-dependencies */
import { DateTime } from 'luxon'
import { asUser } from '@ministryofjustice/hmpps-rest-client'
import { ArnsComponents, RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'
import SentencePlanApiClient from '../data/sentencePlanApiClient'
import { tierLink, toPredictors, toRoshWidget } from '../utils'
import { SentencePlan } from '../models/Risk'
import logger from '../../logger'
import { PersonalDetails } from '../data/model/personalDetails'
import { RiskScoresDto, RiskSummary } from '../data/model/risk'
import { ErrorSummary } from '../data/model/common'
import { UserCaseload } from '../data/model/caseload'

export const getPersonalDetails = (
  hmppsAuthClient: HmppsAuthClient,
  arnsComponents: ArnsComponents,
): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    let sentencePlan: SentencePlan
    let overview: PersonalDetails
    let risks: RiskSummary
    let tierCalculation: TierCalculation
    let predictors: ErrorSummary | RiskScoresDto[]
    let userCaseload: UserCaseload
    let riskData: RiskData
    if (!req?.session?.data?.personalDetails?.[crn] || process.env.NODE_ENV === 'development') {
      const { username } = res.locals.user
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const sentencePlanClient = new SentencePlanApiClient(token)
      const authOptions = asUser(res.locals.user.token)
      ;[overview, risks, tierCalculation, predictors, riskData, userCaseload] = await Promise.all([
        masClient.getPersonalDetails(crn),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
        arnsComponents.getRiskData(authOptions, 'crn', crn),
        masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
      ])
      const popInUsersCaseload = userCaseload?.caseload?.[0]?.crn === crn
      sentencePlan = { showLink: false, showText: false, lastUpdatedDate: '' }
      if (res.locals?.user?.roles?.includes('SENTENCE_PLAN')) {
        try {
          const sentencePlans = await sentencePlanClient.getPlanByCrn(crn)
          let hasAgreedSentencePlan = false
          const agreedSentencePlans = sentencePlans.filter(sp => sp?.currentVersion?.agreementDate)
          if (agreedSentencePlans.length) {
            const latestSentencePlan =
              agreedSentencePlans.length === 1
                ? agreedSentencePlans[0]
                : agreedSentencePlans.sort(
                    (a, b) =>
                      DateTime.fromISO(b.currentVersion.agreementDate).toMillis() -
                      DateTime.fromISO(a.currentVersion.agreementDate).toMillis(),
                  )[0]
            hasAgreedSentencePlan = latestSentencePlan.currentVersion?.agreementStatus !== 'DRAFT'
            sentencePlan.showLink = res.locals?.flags?.enableSentencePlan && hasAgreedSentencePlan
            sentencePlan.lastUpdatedDate = sentencePlan.showLink ? latestSentencePlan?.lastUpdatedDate : ''
            if (sentencePlan.showLink && !popInUsersCaseload) {
              sentencePlan.showText = true
              sentencePlan.showLink = false
            }
          }
        } catch (error) {
          logger.error(error, 'Failed to connect to sentence plan service.')
        }
      }
      req.session.data = {
        ...(req?.session?.data ?? {}),
        personalDetails: {
          ...(req?.session?.data?.personalDetails ?? {}),
          [crn]: {
            overview,
            sentencePlan,
            risks,
            tierCalculation,
            predictors,
          },
        },
      }
    } else {
      ;({ overview, sentencePlan, risks, tierCalculation, predictors } = req.session.data.personalDetails[crn])
    }
    res.locals.sentencePlan = sentencePlan
    res.locals.case = overview
    const roshWidget = toRoshWidget(risks)
    res.locals.tierCalculation = tierCalculation
    res.locals.predictorScores = toPredictors(predictors)
    res.locals.risksWidget = roshWidget
    res.locals.riskData = riskData
    // console.dir(res.locals.predictorScores, { depth: null })
    // console.dir(riskData, { depth: null })
    // console.dir(roshWidget, { depth: null })
    res.locals.headerPersonName = { forename: overview.name.forename, surname: overview.name.surname }
    res.locals.headerCRN = crn
    res.locals.headerDob = overview.dateOfBirth
    if (res.locals?.flags?.enableTierLink) {
      res.locals.headerTierLink = tierLink(crn)
    }
    if (overview?.dateOfDeath) {
      res.locals.dateOfDeath = overview.dateOfDeath
    }
    return next()
  }
}
