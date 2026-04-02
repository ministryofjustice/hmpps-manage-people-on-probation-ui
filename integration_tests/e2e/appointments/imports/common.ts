import { DateTime } from 'luxon'

export const crn = 'X778160'
export const appointmentId = '6'
export const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'
export const date = DateTime.now().plus({ days: 2 }).toISODate()
export const pastDate = DateTime.now().minus({ days: 1 }).toISODate()
export const startTime = '09:00'
export const endTime = '10:00'
export const dateRegex: RegExp =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/
