/* eslint-disable import/no-extraneous-dependencies */
import { asUser } from '@ministryofjustice/hmpps-rest-client'
import { ArnsComponents, RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient, { TierCalculation, LatestTierResponse } from '../data/tierApiClient'
import ArnsAssessmentPlatformApiClient from '../data/arnsAssessmentPlatformApiClient'
import { tierLink, toPredictors, toRoshWidget } from '../utils'
import { SentencePlan } from '../models/Risk'
import logger from '../../logger'
import { PersonalDetails } from '../data/model/personalDetails'
import { RiskScoresDto, RiskSummary } from '../data/model/risk'
import { UserCaseload } from '../data/model/caseload'
import { ErrorSummary } from '../data/model/common'
import { ProbationPractitioner } from '../models/CaseDetail'

export const getPersonalDetails = (
  hmppsAuthClient: HmppsAuthClient,
  arnsComponents: ArnsComponents,
  mpopComponents?: MPoPComponents,
): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params as Record<string, string>
    let sentencePlan: SentencePlan
    let overview: PersonalDetails
    let risks: RiskSummary
    let tierCalculation: TierCalculation
    let userCaseload: UserCaseload
    let riskData: RiskData
    let predictors: RiskScoresDto[] | ErrorSummary
    let probationPractitioner: ProbationPractitioner
    let tierDetails: LatestTierResponse
    if (!req?.session?.data?.personalDetails?.[crn] || process.env.NODE_ENV === 'development') {
      const { username } = res.locals.user
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const arnsAssessmentPlatformClient = new ArnsAssessmentPlatformApiClient(token)
      const authOptions = asUser(res.locals.user.token)
      ;[overview, risks, tierCalculation, userCaseload, riskData, probationPractitioner, tierDetails] =
        await Promise.all([
          masClient.getPersonalDetails(crn),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
          arnsComponents.getRiskData(authOptions, 'crn', crn),
          masClient.getProbationPractitioner(crn),
          mpopComponents?.getTierDetails(authOptions, crn),
        ])
      const popInUsersCaseload = userCaseload?.caseload?.[0]?.crn === crn
      sentencePlan = { showLink: false, showText: false, lastUpdatedDate: '' }
      if (res.locals?.user?.roles?.includes('SENTENCE_PLAN')) {
        try {
          const planResult = await arnsAssessmentPlatformClient.getSentencePlanByCrn(crn, username)
          if (planResult?.hasAgreedPlan) {
            sentencePlan.lastUpdatedDate = planResult.lastUpdatedDate
            if (!popInUsersCaseload) {
              sentencePlan.showText = true
              sentencePlan.showLink = false
            } else {
              sentencePlan.showLink = true
            }
          }
        } catch (error) {
          logger.error(error, 'Failed to connect to Assessment Platform API.')
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
            riskData,
            probationPractitioner,
            tierDetails,
          },
        },
      }
    } else {
      ;({ overview, sentencePlan, risks, tierCalculation, riskData, tierDetails } =
        req.session.data.personalDetails[crn])
    }
    res.locals.sentencePlan = sentencePlan
    res.locals.case = overview
    res.locals.tierCalculation = tierCalculation
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.risks = risks
    res.locals.riskData = riskData
    res.locals.tierDetails = tierDetails
    res.locals.headerPersonName = { forename: overview.name.forename, surname: overview.name.surname }
    res.locals.headerCRN = crn
    res.locals.headerDob = overview.dateOfBirth
    res.locals.headerTierLink = tierLink(crn)
    if (overview?.dateOfDeath) {
      res.locals.dateOfDeath = overview.dateOfDeath
    }
    return next()
  }
}
