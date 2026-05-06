import { Activity } from '../data/model/schedule'
import { getApprovedContactCode, normalizeContactDisplayNameKey } from './contactDisplayNames'

const APPOINTMENT_TYPE_CODE_BY_NAME = new Map<string, string>(
  Object.entries({
    'Home visit to case (NS)': 'HomeVisitToCaseNS',
    'Initial appointment - home visit': 'InitialAppointmentHomeVisitNS',
    'Initial appointment - home visit (NS)': 'InitialAppointmentHomeVisitNS',
    'Initial appointment - in office': 'InitialAppointmentInOfficeNS',
    'Initial appointment - in office (NS)': 'InitialAppointmentInOfficeNS',
    'Initial appointment': 'InitialAppointmentInOfficeNS',
    'Office appointment': 'PlannedOfficeVisitNS',
    'Planned appointment': 'PlannedOfficeVisitNS',
    'Planned office visit': 'PlannedOfficeVisitNS',
    'Planned office visit (NS)': 'PlannedOfficeVisitNS',
    'Planned telephone contact': 'PlannedTelephoneContactNS',
    'Planned telephone contact (NS)': 'PlannedTelephoneContactNS',
    'Planned video contact': 'PlannedVideoContactNS',
    'Planned video contact (NS)': 'PlannedVideoContactNS',
  }).map(([name, code]) => [normalizeContactDisplayNameKey(name), code]),
)

const getNonEmptyString = (...values: unknown[]): string | undefined => {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

const getActivityContactCode = (activity: Activity & Record<string, unknown>): string | undefined => {
  const directCode = getNonEmptyString(activity.code, activity.typeCode, activity.contactCode)

  if (directCode) {
    return directCode
  }

  const approvedContactCode =
    getApprovedContactCode(activity.displayName) ||
    getApprovedContactCode(activity.action) ||
    getApprovedContactCode(activity.type)

  if (approvedContactCode) {
    return approvedContactCode
  }

  return APPOINTMENT_TYPE_CODE_BY_NAME.get(normalizeContactDisplayNameKey(activity.displayName || activity.type))
}

export const activityLogEventName = (
  prefix: string,
  activity: Activity & Record<string, unknown>,
): string | undefined => {
  const code = getActivityContactCode(activity)
  return code ? `${prefix}_${code}` : undefined
}
