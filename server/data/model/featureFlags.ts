/* eslint-disable lines-between-class-members */
export class FeatureFlags {
  [index: string]: boolean
  enableDocumentTextSearch?: boolean = undefined
  enableAppointmentCreate?: boolean = undefined
  enableRepeatAppointments?: boolean = undefined
  enableDeleteAppointmentFile?: boolean = undefined
  enableManageAppointments?: boolean = undefined
  enableSentencePlan?: boolean = undefined
  enableSanIndicator?: boolean = undefined
}
