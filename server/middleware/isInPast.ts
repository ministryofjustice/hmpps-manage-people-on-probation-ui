import { Route } from '../@types'
import { dateIsInPast } from '../utils'

export const checkIsInPast: Route<void> = (req, res) => {
  const { date, time = '' } = req.body
  const alertDismissed = req?.session?.alertDismissed
  const { isInPast, isToday } = dateIsInPast(date, time)
  return res.json({ isInPast, isToday, alertDismissed })
}
