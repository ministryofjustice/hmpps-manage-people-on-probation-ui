import { DateTime } from 'luxon'

export const dateIsInPast = (
  appointmentDate?: string,
  appointmentStartTime?: string,
): { isInPast: boolean; isToday: boolean } => {
  let isInPast = false
  let isToday = false
  if (appointmentDate) {
    const dt = DateTime.fromFormat(appointmentDate, 'yyyy-M-d')
    const now = DateTime.now()
    isToday = dt.hasSame(now, 'day')
    if (isToday) {
      if (appointmentStartTime) {
        const time = DateTime.fromFormat(appointmentStartTime, 'H:mm')
        const { day, month, year } = now
        const appointmentTime = time.set({
          year,
          month,
          day,
        })
        isInPast = appointmentTime < now
      } else {
        isInPast = false
      }
    } else {
      isInPast = dt < now
    }
  }
  return { isInPast, isToday }
}
