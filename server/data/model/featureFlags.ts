/* eslint-disable lines-between-class-members */
export class FeatureFlags {
  [index: string]: boolean
  enableNavOverview?: boolean = undefined
  enableNavAppointments?: boolean = undefined
  enableNavPersonalDetails?: boolean = undefined
  enableNavDocuments?: boolean = undefined
  enableNavRisk?: boolean = undefined
  enableNavSentence?: boolean = undefined
  enableNavActivityLog?: boolean = undefined
  enableNavCompliance?: boolean = undefined
  enableNavInterventions?: boolean = undefined
  enableAppointmentCreate?: boolean = undefined
}
