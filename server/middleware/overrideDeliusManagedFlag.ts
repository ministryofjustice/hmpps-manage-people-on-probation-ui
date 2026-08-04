import { Route } from '../@types'
import { Activity } from '../data/model/schedule'

export const overrideDeliusManagedFlag = (appointments: Activity[]): Route<Activity[]> => {
  return (_req, res) => {
    return appointments.map(appointment => {
      const sentence = res.locals?.sentences?.find(s => s.eventNumber === appointment.eventNumber)
      return {
        ...appointment,
        deliusManaged:
          appointment?.deliusManaged !== true
            ? sentence?.order?.sentenceType === 'PRE_SENTENCE'
            : appointment?.deliusManaged,
      }
    })
  }
}
