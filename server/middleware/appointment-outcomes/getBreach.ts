import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { SentenceCompliance } from '../../data/model/compliance'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeBreach } from '../../models/Locals'

export const getBreach = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { appointment } = res.locals.appointmentOutcome
    let breach: AppointmentOutcomeBreach = null
    const { crn } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { currentSentences } = await masClient.getPersonCompliance(crn)
    const currentSentence: SentenceCompliance = currentSentences.find(
      sentence => sentence.eventNumber === (appointment as Activity)?.eventNumber,
    )
    if (currentSentence?.activeBreach) {
      const date = DateTime.fromFormat(currentSentence.activeBreach.startDate, 'yyyy-MM-dd').toFormat('cccc d MMMM')
      const order = currentSentence?.order?.description || ''
      breach = {
        date,
        order,
      }
    }
    res.locals.appointmentOutcome.breach = breach
    return next()
  }
}
