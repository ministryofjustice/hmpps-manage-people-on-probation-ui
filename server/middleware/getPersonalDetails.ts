/* eslint-disable import/no-extraneous-dependencies */
import { asUser } from '@ministryofjustice/hmpps-rest-client'
import { ArnsComponents, RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import { Route } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'
import ArnsAssessmentPlatformApiClient from '../data/arnsAssessmentPlatformApiClient'
import { tierLink, toRoshWidget } from '../utils'
import { SentencePlan } from '../models/Risk'
import logger from '../../logger'
import { PersonalDetails, ProfessionalContact } from '../data/model/personalDetails'
import { ErrorSummary } from '../data/model/common'
import { RiskSummary } from '../data/model/risk'
import { UserCaseload } from '../data/model/caseload'
import { ProbationPractitioner } from '../models/CaseDetail'
import { getManagedByDetails } from '../utils/getManagedByDetails'

export const getPersonalDetails = (
  hmppsAuthClient: HmppsAuthClient,
  arnsComponents: ArnsComponents,
): Route<Promise<void>> => {
  return async function getPersonalDetailsInner(req, res, next) {
    const { url, params } = req
    const { crn } = params as Record<string, string>
    let sentencePlan: SentencePlan
    let overview: PersonalDetails
    let risks: RiskSummary
    let tierCalculation: TierCalculation
    let userCaseload: UserCaseload
    let riskData: RiskData
    let probationPractitioner: ProbationPractitioner
    let professionalContact: ProfessionalContact | null
    let personPhotoSrc: string | undefined
    let arnsUnavailable = false
    let prisonsUnavailable = false
    let token: string | undefined
    const refreshCache = res.locals?.flags?.enableAllowSms && url.includes('/location-date-time')
    const masClient = new MasApiClient(token)
    if (refreshCache && req?.session?.data?.personalDetails?.[crn]) {
      token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      overview = await masClient.getPersonalDetails(crn)
    } else if (!req?.session?.data?.personalDetails?.[crn]) {
      const { username } = res.locals.user
      token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const arnsAssessmentPlatformClient = new ArnsAssessmentPlatformApiClient(token)
      const authOptions = asUser(res.locals.user.token)
      // Failure isolation (MAN-2840) is only applied for the new person-header - the legacy
      // header keeps its original behaviour, where an ARNS/Prisons failure fails the whole page.
      const isolateApiFailures = res.locals.flags?.enablePersonHeader
      const risksPromise = arnsClient.getRisks(crn)
      const riskDataPromise = arnsComponents.getRiskData(authOptions, 'crn', crn)
      ;[overview, risks, tierCalculation, userCaseload, riskData, probationPractitioner, professionalContact] =
        await Promise.all([
          masClient.getPersonalDetails(crn),
          isolateApiFailures
            ? risksPromise.catch((): null => {
                arnsUnavailable = true
                return null
              })
            : risksPromise,
          tierClient.getCalculationDetails(crn),
          masClient.searchUserCaseload(username, '', '', { nameOrCrn: crn }),
          isolateApiFailures
            ? riskDataPromise.catch((): null => {
                arnsUnavailable = true
                return null
              })
            : riskDataPromise,
          masClient.getProbationPractitioner(crn),
          masClient.getContacts(crn).catch((): ProfessionalContact | null => null),
        ])
      if (isolateApiFailures) {
        if (risks && (risks as unknown as ErrorSummary).errors !== undefined) {
          arnsUnavailable = true
          risks = null as unknown as RiskSummary
        }

        if (riskData && riskData.httpStatus !== 200 && riskData.httpStatus !== 404) {
          arnsUnavailable = true
          riskData = null as unknown as RiskData
        }
      }
      if (overview.noms) {
        const photoData = await new PrisonApiClient(token).getImageData(overview.noms).catch((): null => {
          if (isolateApiFailures) prisonsUnavailable = true
          return null
        })
        personPhotoSrc = photoData ? `/search/prisoner-image/${encodeURIComponent(overview.noms)}` : undefined
      }

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

      req.session.data = req?.session?.data ?? {}

      if (!arnsUnavailable && !prisonsUnavailable) {
        req.session.data.personalDetails = {
          ...(req.session.data.personalDetails ?? {}),
          [crn]: {
            overview,
            sentencePlan,
            risks,
            tierCalculation,
            riskData,
            probationPractitioner,
            professionalContact,
            personPhotoSrc,
            arnsUnavailable,
            prisonsUnavailable,
          },
        }
      }
    } else {
      ;({
        overview,
        sentencePlan,
        risks,
        tierCalculation,
        riskData,
        probationPractitioner,
        professionalContact,
        personPhotoSrc,
        arnsUnavailable,
        prisonsUnavailable,
      } = req.session.data.personalDetails[crn])
    }
    res.locals.sentencePlan = sentencePlan
    res.locals.case = overview
    res.locals.tierCalculation = tierCalculation
    res.locals.risksWidget = toRoshWidget(risks)
    res.locals.risks = risks
    res.locals.riskData = riskData
    res.locals.probationPractitioner = probationPractitioner
    res.locals.managedBy = getManagedByDetails(crn, professionalContact)
    res.locals.personPhotoSrc = personPhotoSrc
    res.locals.arnsUnavailable = arnsUnavailable
    res.locals.prisonsUnavailable = prisonsUnavailable
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
