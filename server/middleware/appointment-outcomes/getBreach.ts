import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue } from '../../utils'

export const getBreach = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = res.locals.appointmentOutcome
    const selectedSentence = getDataValue(req.session.data, ['appointments', crn, id, 'eventId'])

    const sentences = req.session.data.sentences?.[crn]
    res.locals.appointmentOutcome.breachWarning = null

    if (sentences && selectedSentence) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const [compliance, nonCompliance] = await Promise.all([
        masClient.getPersonCompliance(crn),
        masClient.getPersonNonCompliance(crn),
      ])

      // eslint-disable-next-line eqeqeq
      const sentence = sentences.find(s => s.id == selectedSentence)

      const currentSentence = sentence
        ? compliance.currentSentences.find(
            // eslint-disable-next-line eqeqeq
            s => s?.eventNumber == sentence?.eventNumber,
          )
        : compliance.currentSentences[0]

      if (currentSentence) {
        if (
          currentSentence.activeBreach &&
          (currentSentence.eventNumber === sentence?.eventNumber || !selectedSentence)
        ) {
          res.locals.appointmentOutcome.breachWarning = {
            order: sentence?.order?.description || sentences[0]?.order?.description,
            breachDate: currentSentence.activeBreach.startDate,
          }
        }

        res.locals.appointmentOutcome.compliance = {
          ...res.locals.appointmentOutcome.compliance,
          ...currentSentence.compliance,
          failureToComplyInLast12MonthsCount:
            currentSentence.compliance.failureToComplyInLast12MonthsCount ??
            currentSentence.compliance.failureToComplyCount ??
            currentSentence.compliance.failureToComplyInLast12Months,
          priorBreachesOnCurrentOrderCount:
            currentSentence.compliance.priorBreachesOnCurrentOrderCount ??
            currentSentence.compliance.breachesOnCurrentOrderCount,
          nonCompliance,
        }
      }
    }

    return next()
  }
}
