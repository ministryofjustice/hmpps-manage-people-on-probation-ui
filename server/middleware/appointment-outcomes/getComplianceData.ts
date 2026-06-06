import logger from '../../../logger'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Compliance } from '../../data/model/overview'
import { OutcomeCompliance } from '../../models/Locals'
import { getDataValue } from '../../utils'
import { buildCompliance } from './buildCompliance'

export const getComplianceData = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    if (!res.locals.appointmentOutcome) {
      return next()
    }
    /*
    const { crn, appointmentSession, sentence } = res.locals.appointmentOutcome

    let compliance: OutcomeCompliance = null

    if (sentence?.eventId) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      const [personCompliance, nonCompliance] = await Promise.all([
        masClient.getPersonCompliance(crn),
        masClient.getPersonNonCompliance(crn),
      ])



      const currentSentenceCompliance =
        personCompliance.currentSentences.find(s => s?.eventNumber === sentence?.eventNumber) ||
        (!sentence ? personCompliance.currentSentences[0] : null)

      let compliance: OutcomeCompliance = {
        currentSentences: personCompliance.currentSentences
        sentence,
        nonCompliance,
      }

      if (currentSentenceCompliance) {
        const failureToComplyInLast12MonthsCount =
          currentSentenceCompliance.compliance?.failureToComplyInLast12MonthsCount ??
          currentSentenceCompliance.compliance?.failureToComplyCount ??
          currentSentenceCompliance.compliance?.failureToComplyInLast12Months
        const priorBreachesOnCurrentOrderCount =
          currentSentenceCompliance.compliance?.priorBreachesOnCurrentOrderCount ??
          currentSentenceCompliance.compliance?.breachesOnCurrentOrderCount
        compliance = { ...compliance, failureToComplyInLast12MonthsCount, priorBreachesOnCurrentOrderCount }
      }
      res.locals.appointmentOutcome.compliance = compliance
    }
      */

    return next()
  }
}
