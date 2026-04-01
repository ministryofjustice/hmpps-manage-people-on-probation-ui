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
import { UserCaseload } from '../data/model/caseload'
import { ErrorSummary } from '../data/model/common'

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
    let userCaseload: UserCaseload
    let riskData: RiskData
    let predictors: RiskScoresDto[] | ErrorSummary
    if (!req?.session?.data?.personalDetails?.[crn] || process.env.NODE_ENV === 'development') {
      const { username } = res.locals.user
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const sentencePlanClient = new SentencePlanApiClient(token)
      const authOptions = asUser(res.locals.user.token)
      if (res?.locals?.flags?.enableOGRS4) {
        ;[overview, risks, tierCalculation, userCaseload, riskData] = await Promise.all([
          masClient.getPersonalDetails(crn),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
          arnsComponents.getRiskData(authOptions, 'crn', crn),
        ])
      } else {
        ;[overview, risks, tierCalculation, userCaseload, predictors] = await Promise.all([
          masClient.getPersonalDetails(crn),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
          arnsClient.getPredictorsAll(crn),
        ])
      }

      const popInUsersCaseload = userCaseload?.caseload?.[0]?.crn === crn
      sentencePlan = { showLink: false, showText: false, lastUpdatedDate: '' }
      if (res.locals?.user?.roles?.includes('SENTENCE_PLAN')) {
        try {
          const sentencePlans = await sentencePlanClient.getPlanByCrn(crn)
          let hasAgreedSentencePlan = false
          if (sentencePlans?.length) {
            const agreedSentencePlans = sentencePlans.filter(sp => sp?.currentVersion?.agreementDate)
            if (agreedSentencePlans?.length) {
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
          }
        } catch (error) {
          logger.error(error, 'Failed to connect to sentence plan service.')
        }
      }
      if (res?.locals?.flags?.enableOGRS4) {
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
            },
          },
        }
      } else {
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
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (res?.locals?.flags?.enableOGRS4) {
        ;({ overview, sentencePlan, risks, tierCalculation, riskData } = req.session.data.personalDetails[crn])
      } else {
        ;({ overview, sentencePlan, risks, tierCalculation, predictors } = req.session.data.personalDetails[crn])
      }
    }
    res.locals.sentencePlan = sentencePlan
    res.locals.case = overview
    res.locals.tierCalculation = tierCalculation
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.risks = risks
    if (res?.locals?.flags?.enableOGRS4) {
      res.locals.riskData = riskData
    } else {
      res.locals.predictorScores = toPredictors(predictors)
    }
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
