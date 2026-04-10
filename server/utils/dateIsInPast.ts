import { DateTime } from 'luxon'

export const dateIsInPast = (
  appointmentDate?: string,
  appointmentStartTime?: string,
): { isInPast: boolean; isToday: boolean } => {
  let isInPast = false
  let isToday = false

  const now = DateTime.now().setZone('Europe/London').setZone('Europe/London')

  if (appointmentDate) {
    const dt = DateTime.fromFormat(appointmentDate, 'yyyy-M-d', {
      zone: 'Europe/London',
    })

    isToday = dt.hasSame(now, 'day')

    if (isToday) {
      if (appointmentStartTime) {
        const time = DateTime.fromFormat(appointmentStartTime, 'H:mm', {
          zone: 'Europe/London',
        })

        const appointmentTime = time.set({
          year: now.year,
          month: now.month,
          day: now.day,
        })

        isInPast = appointmentTime < now
      } else {
        isInPast = false
      }
    } else {
      isInPast = dt < now.startOf('day') // 👈 important fix
    }
  }

  return { isInPast, isToday }
}
