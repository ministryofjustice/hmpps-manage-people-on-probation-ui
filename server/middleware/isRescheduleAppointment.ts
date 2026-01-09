import { Request } from 'express'

export const isRescheduleAppointment = (req: Request): boolean => {
  const { change = null } = req?.query as Record<string, string>
  if (!change) return false
  return change.includes('/reschedule')
}
