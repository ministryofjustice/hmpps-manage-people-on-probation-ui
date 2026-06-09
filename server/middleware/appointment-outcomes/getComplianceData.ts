import logger from '../../../logger'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { getDataValue } from '../../utils'
import { buildCompliance } from './buildCompliance'

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

      const sentence = sentences?.find(s => s.id?.toString() === selectedSentence)

      const currentSentenceCompliance =
        compliance.currentSentences.find(s => s?.eventNumber === sentence?.eventNumber) ||
        (!sentence ? compliance.currentSentences[0] : null)

      if (!currentSentenceCompliance) {
        logger.warn(
          `No compliance data found for CRN: ${crn}, eventNumber: ${sentence?.eventNumber} (selectedSentence: ${selectedSentence})`,
        )
        res.locals.appointmentOutcome.compliance = {
          ...res.locals.appointmentOutcome.compliance,
          nonCompliance,
        }
      } else {
        res.locals.appointmentOutcome.compliance = buildCompliance(
          currentSentenceCompliance,
          nonCompliance,
          res.locals.appointmentOutcome.compliance,
        )
      }
    }

    return next()
  }
}
