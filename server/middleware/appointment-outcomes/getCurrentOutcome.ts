import type { Route } from '../../@types'
import type { Activity } from '../../data/model/schedule'
import type { AppointmentOutcomeProps, TagColour } from '../../models/Locals'

type Status =
  | 'Not started'
  | 'Complied'
  | 'Failed to comply'
  | 'Acceptable absence'
  | 'Unacceptable absence'
  | 'Rescheduled'

export const getCurrentOutcome: Route<void> = (_req, res, next): void => {
  const { appointment } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
  const { acceptableAbsence, acceptableAbsenceReason, hasOutcome, wasAbsent, rescheduled, didTheyComply } = appointment
  let tagColour: TagColour = 'BLUE'
  let reason: string = null
  let status: Status = 'Not started'
  if (!rescheduled && hasOutcome) {
    // Complied
    if (didTheyComply === true && wasAbsent === false) {
      status = 'Complied'
      tagColour = 'GREEN'
    }
    // Acceptable absence
    else if (didTheyComply === true && acceptableAbsence === true && wasAbsent === true) {
      status = 'Acceptable absence'
      reason = acceptableAbsenceReason
      tagColour = 'GREEN'
    }
    // Unacceptable absence
    else if (didTheyComply === false && acceptableAbsence === false && wasAbsent === true) {
      status = 'Unacceptable absence'
      tagColour = 'RED'
    } else {
      // Failed to comply
      status = 'Failed to comply'
      tagColour = 'RED'
    }
  }
  if (rescheduled && hasOutcome) {
    status = 'Rescheduled'
    tagColour = 'BLUE'
  }
  res.locals.appointmentOutcome.currentOutcome = { status, reason, tagColour }
  return next()
}
