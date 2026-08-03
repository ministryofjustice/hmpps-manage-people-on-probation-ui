import { Route } from '../@types'
import { Activity } from '../data/model/schedule'

export const overrideDeliusManagedFlag = (appointments: Activity[]): Route<Activity[]> => {
  return (_req, res) => {
    return appointments.reduce((acc, appointment) => {
      const sentence = res.locals?.sentences?.find(s => s.eventNumber === appointment.eventNumber)
      return [...acc, { ...appointment, deliusManaged: sentence?.order?.sentenceType === 'PRE_SENTENCE' }]
    }, [] as Activity[])
  }
}
