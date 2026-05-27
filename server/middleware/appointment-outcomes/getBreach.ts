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
      const compliance = await masClient.getPersonCompliance(crn)

      // eslint-disable-next-line eqeqeq
      const sentence = sentences.find(s => s.id == selectedSentence)

      const currentSentence = compliance.currentSentences.find(
        // eslint-disable-next-line eqeqeq
        s => s?.activeBreach && s?.eventNumber == sentence?.eventNumber,
      )

      if (currentSentence?.activeBreach) {
        res.locals.appointmentOutcome.breachWarning = {
          order: sentence?.order?.description,
          breachDate: currentSentence.activeBreach.startDate,
        }
      }
    }

    return next()
  }
}
