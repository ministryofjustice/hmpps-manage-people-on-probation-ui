import { DateTime } from 'luxon'
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
import {
  RiskScoresDto,
  RiskSummary,
  RoshRiskWidgetDto,
  Scores,
  ArnsComponentData,
  Predictor,
  ScoreType,
} from '../data/model/risk'
import { ErrorSummary } from '../data/model/common'
import { UserCaseload } from '../data/model/caseload'

export const getPersonalDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    let sentencePlan: SentencePlan
    let overview: PersonalDetails
    let risks: RiskSummary
    let tierCalculation: TierCalculation
    let predictors: ErrorSummary | RiskScoresDto[]
    let userCaseload: UserCaseload
    if (!req?.session?.data?.personalDetails?.[crn] || process.env.NODE_ENV === 'development') {
      const { username } = res.locals.user
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const sentencePlanClient = new SentencePlanApiClient(token)
      ;[overview, risks, tierCalculation, predictors, userCaseload] = await Promise.all([
        masClient.getPersonalDetails(crn),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
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
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.tierCalculation = tierCalculation
    res.locals.predictorScores = toPredictors(predictors)
    res.locals.risksData = arnsComponentsData(res.locals.predictorScores.scores, res.locals.risksWidget)
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

const mapping: { [key: string]: { title: string; staticOrDynamic: ScoreType } } = {
  RSR: { title: 'Combined Serious Reoffending Predictor', staticOrDynamic: 'Dynamic' },
  OGP: { title: 'OASys General Predictor Score', staticOrDynamic: 'Dynamic' },
  OSPC: { title: 'Direct Contact - Sexual Reoffending Predictor', staticOrDynamic: 'Static' },
  OSPI: { title: 'Images and Indirect Contact - Sexual Reoffending Predictor', staticOrDynamic: 'Static' },
  OGRS: { title: 'All Reoffending Predictor', staticOrDynamic: 'Static' },
  OVP: { title: 'Violent Reoffending Predictor', staticOrDynamic: 'Dynamic' },
}

const arnsComponentsData = (scores: Scores, risksWidget: RoshRiskWidgetDto): ArnsComponentData => {
  const rosh = { ROSH: { name: 'ROSH', band: risksWidget.overallRisk } }
  const predictors = Object.entries(scores).reduce((acc, [key, entry]) => {
    const predictor: Predictor = {
      name: mapping[key].title,
      band: entry.level,
      staticOrDynamic: mapping[key].staticOrDynamic,
    }
    if (entry.score) predictor.score = entry.score
    if (entry.oneYear) predictor.oneYear = entry.oneYear
    if (entry.twoYears) predictor.twoYears = entry.twoYears
    // eslint-disable-next-line no-param-reassign
    acc = {
      ...acc,
      [key]: predictor,
    }
    return acc
  }, rosh)
  return { assessments: [predictors] }
}
