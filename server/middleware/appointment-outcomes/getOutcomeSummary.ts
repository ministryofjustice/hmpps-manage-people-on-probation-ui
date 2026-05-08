import { Route } from '../../@types'

interface OutcomeSummary {
  outcome: string
  notes: string
  sensitivity: string
  documents: string
  nextAppointment: string
}
export const getOutcomeSummary: Route<void> = (req, res, next) => {
  return next()
}
