import { DateTime } from 'luxon'
import { type Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { type Sentence } from '../../data/model/sentenceDetails'
import { type AppointmentOutcomeSentence } from '../../models/Locals'
import { getDataValue } from '../../utils'

export const getOutcomeSentence = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { data } = req.session
    const { appointmentSession, crn } = res.locals.appointmentOutcome
    const sentences = getDataValue<Sentence[]>(data, ['sentences', crn])
    const eventId = appointmentSession?.eventId
    const appointmentSentence: Sentence = eventId
      ? sentences?.find(_sentence => _sentence.id.toString() === eventId)
      : null
    const startDate = appointmentSentence?.order?.startDate
    const endDate = appointmentSentence?.order?.endDate
    let sentenceLength = null
    if (startDate && endDate) {
      const start = DateTime.fromISO(startDate)
      const end = DateTime.fromISO(endDate)
      sentenceLength = end.diff(start, 'months').months
    }
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const personCompliance = await masClient.getPersonCompliance(crn)

    const currentSentenceCompliance =
      personCompliance.currentSentences.find(s => s?.eventNumber === appointmentSentence?.eventNumber) || null
    const type = appointmentSentence?.sentenceType || null
    const sentence: AppointmentOutcomeSentence = {
      type,
      length: sentenceLength,
      eventId: appointmentSentence?.id || null,
      eventNumber: appointmentSentence?.eventNumber || null,
      order: appointmentSentence?.order?.description,
      compliance: currentSentenceCompliance?.compliance || null,
    }
    if (type === 'COMMUNITY') {
      sentence.activeBreach = currentSentenceCompliance?.activeBreach || null
    }
    if (type === 'CUSTODY') {
      sentence.activeRecall = currentSentenceCompliance?.activeRecall || null
    }
    res.locals.appointmentOutcome.sentence = sentence
    return next()
  }
}
