import { DateTime } from 'luxon'
import { Activity } from '../../data/model/schedule'

export const appointments = [
  {
    startDateTime: DateTime.now().plus({ days: 4 }).toString(),
  },
  {
    startDateTime: DateTime.now().plus({ days: 3 }).toString(),
  },
  {
    startDateTime: DateTime.now().plus({ days: 2 }).toString(),
  },
  {
    startDateTime: DateTime.now().minus({ days: 1 }).toString(),
    isNationalStandard: true,
    isAppointment: true,
    hasOutcome: true,
  },
  {
    startDateTime: DateTime.now().minus({ days: 2 }).toString(),
    isNationalStandard: true,
    absentWaitingEvidence: true,
    isAppointment: true,
    rarCategory: 'Stepping Stones',
  },
  {
    startDateTime: DateTime.now().minus({ days: 3 }).toString(),
    hasOutcome: false,
  },
  {
    startDateTime: DateTime.now().minus({ days: 4 }).toString(),
    hasOutcome: true,
    rarCategory: 'Choices and Changes',
  },
] as unknown as Activity[]
