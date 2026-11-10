import { Activity } from '../data/model/schedule'

// When an online check in is cancelled, NDelius (esupervision-and-delius) keeps the existing
// check in contact and its type, but sets the contact description to this value.
export const CANCELLED_CHECK_IN_DESCRIPTION = 'Online check in cancelled'

export const isCancelledCheckIn = (activity?: Pick<Activity, 'esupervisionId' | 'description'>): boolean =>
  Boolean(activity?.esupervisionId) &&
  activity?.description?.trim().toLowerCase() === CANCELLED_CHECK_IN_DESCRIPTION.toLowerCase()
