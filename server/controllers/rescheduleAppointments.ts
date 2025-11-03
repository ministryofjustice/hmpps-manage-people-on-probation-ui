import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../@types'
import { isValidCrn, isValidUUID } from '../utils'

import { renderError } from '../middleware'
import config from '../config'
import MasApiClient from '../data/masApiClient'

const routes = ['redirectToRescheduleAppointment', 'getRescheduleAppointment'] as const

const rescheduleAppointmentController: Controller<typeof routes, void> = {
  redirectToRescheduleAppointment: () => {
    return async (req, res) => {
      const uuid = uuidv4()
      const { crn, contactId } = req.params
      const { back } = req.query
      if (!isValidCrn(crn) || !isValidUUID(uuid)) {
        return renderError(404)(req, res)
      }
      if (back) {
        return res.redirect(`/case/${crn}/reschedule-appointment/${uuid}/reschedule/${contactId}?back=${back}`)
      }
      return res.redirect(`/case/${crn}/reschedule-appointment/${uuid}/reschedule/${contactId}`)
    }
  },
  getRescheduleAppointment: _hmppsAuthClient => {
    const { maxCharCount } = config
    return async (req, res) => {
      const { crn, id, contactId } = req.params as Record<string, string>
      const token = await _hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { username } = res.locals.user
      const [personAppointment] = await Promise.all([masClient.getPersonAppointment(crn, contactId)])
      res.render('pages/appointments/reschedule-appointment', {
        crn,
        id,
        maxCharCount,
        personAppointment,
        contactId,
      })
    }
  },
}

export default rescheduleAppointmentController
