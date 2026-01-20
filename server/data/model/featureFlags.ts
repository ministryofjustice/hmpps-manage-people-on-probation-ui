/* eslint-disable lines-between-class-members */
export class FeatureFlags {
  [index: string]: boolean
  enableAppointmentCreate?: boolean = undefined
  enableDeleteAppointmentFile?: boolean = undefined
  enableManageAppointments?: boolean = undefined
  enableSentencePlan?: boolean = undefined
  enableSanIndicator?: boolean = undefined
  enableProbFEComponent?: boolean = undefined
  enableESuperVision?: boolean = undefined
  enablePastAppointments?: boolean = undefined
  enableRescheduleAppointment?: boolean = undefined
  enableManageCheckins?: boolean = undefined
}
