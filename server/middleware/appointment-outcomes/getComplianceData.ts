import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue } from '../../utils'

export const getComplianceData = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    if (!res.locals.appointmentOutcome) {
      return next()
    }
    const { crn, id } = res.locals.appointmentOutcome
    const selectedSentence = getDataValue(req.session.data, ['appointments', crn, id, 'eventId'])

    if (selectedSentence) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      const [compliance, nonCompliance] = await Promise.all([
        masClient.getPersonCompliance(crn),
        masClient.getPersonNonCompliance(crn),
      ])

      const sentences = req.session.data.sentences?.[crn]
      // eslint-disable-next-line eqeqeq
      const sentence = sentences?.find(s => s.id == selectedSentence)

      const currentSentenceCompliance =
        compliance.currentSentences.find(
          // eslint-disable-next-line eqeqeq
          s => s?.eventNumber == sentence?.eventNumber,
        ) || (!sentence ? compliance.currentSentences[0] : null)

      if (!currentSentenceCompliance) {
        console.warn(
          `No compliance data found for CRN: ${crn}, eventNumber: ${sentence?.eventNumber} (selectedSentence: ${selectedSentence})`,
        )
      }

      res.locals.appointmentOutcome.compliance = {
        ...res.locals.appointmentOutcome.compliance,
        ...currentSentenceCompliance?.compliance,
        failureToComplyInLast12MonthsCount:
          currentSentenceCompliance?.compliance?.failureToComplyInLast12MonthsCount ??
          currentSentenceCompliance?.compliance?.failureToComplyCount ??
          currentSentenceCompliance?.compliance?.failureToComplyInLast12Months,
        priorBreachesOnCurrentOrderCount:
          currentSentenceCompliance?.compliance?.priorBreachesOnCurrentOrderCount ??
          currentSentenceCompliance?.compliance?.breachesOnCurrentOrderCount,
        nonCompliance,
      }
    }

    return next()
  }
}
