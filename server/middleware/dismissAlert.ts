import { Route } from '../@types'

export const dismissAlert: Route<void> = (req, res) => {
  req.session.alertDismissed = true
  return res.json({ success: true })
}
