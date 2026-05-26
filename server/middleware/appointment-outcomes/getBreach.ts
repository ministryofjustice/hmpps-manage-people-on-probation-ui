import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue } from '../../utils'

export const getBreach = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = res.locals.appointmentOutcome
    const selectedSentence = getDataValue(req.session.data, ['appointments', crn, id, 'eventId'])

    const sentences = req.session.data.sentences?.[crn]
    try {
      if (Number.isFinite(Number(selectedSentence)) && sentences && res.locals.flags.enableNonCompliance) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        const compliance = await masClient.getPersonCompliance(crn)

        const sentence = sentences.find(({ id: sentenceId }) => String(sentenceId) === String(selectedSentence))
        const foundSentence = sentence
          ? (compliance.currentSentences.find(
              currentSentence =>
                currentSentence.activeBreach && String(currentSentence.eventNumber) === String(sentence.eventNumber),
            ) ?? null)
          : null

        res.locals.appointmentOutcome.breachWarning = foundSentence
          ? { order: sentence.order.description, breachDate: foundSentence.activeBreach.startDate }
          : null
      } else {
        res.locals.appointmentOutcome.breachWarning = null
      }
    } catch (error) {
      res.locals.appointmentOutcome.breachWarning = null
    } finally {
      next()
    }
  }
}
