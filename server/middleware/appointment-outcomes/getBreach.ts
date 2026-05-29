import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue } from '../../utils'
import { buildCompliance } from './buildCompliance'

export const getBreach = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = res.locals.appointmentOutcome
    const selectedSentence = getDataValue<string>(req.session.data, ['appointments', crn, id, 'eventId'])

    const sentences = req.session.data.sentences?.[crn]
    res.locals.appointmentOutcome.breachWarning = null

    if (sentences && selectedSentence) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      const compliance = await masClient.getPersonCompliance(crn)
      const nonCompliance = await masClient.getPersonNonCompliance(crn)

      const sentence = sentences.find(s => s.id && s.id.toString() === selectedSentence)

      const currentSentence = compliance.currentSentences.find(
        s => s.activeBreach && s.eventNumber && sentence?.eventNumber && s.eventNumber === sentence.eventNumber,
      )

      if (currentSentence?.activeBreach && sentence?.order?.description && currentSentence?.activeBreach?.startDate) {
        res.locals.appointmentOutcome.breachWarning = {
          order: sentence.order.description,
          breachDate: currentSentence.activeBreach.startDate,
        }

        res.locals.appointmentOutcome.compliance = buildCompliance(
          currentSentence,
          nonCompliance,
          res.locals.appointmentOutcome.compliance,
        )
      }
    }

    return next()
  }
}
