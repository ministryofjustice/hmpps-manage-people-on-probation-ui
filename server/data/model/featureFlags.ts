/* eslint-disable lines-between-class-members */
export class FeatureFlags {
  [index: string]: boolean
  enableSmsReminders?: boolean = undefined
  enableCompliancePage?: boolean = undefined
  enableManageContacts?: boolean = undefined
  enableDeliusClient?: boolean = undefined
  enableMAN2344?: boolean = undefined
  enableNonCompliance?: boolean = undefined
  enableDeepLinks?: boolean = undefined
  enableOutcomesV1?: boolean = undefined
  enableESupervisionCheckins?: boolean = undefined
  enableHomePageOutcomesWithFilter?: boolean = undefined
  enableSensitivityRemoved?: boolean = undefined
  enableMyEnforcementActionsOverview?: boolean = undefined
  enableShowMatchWithConcern?: boolean = undefined
  enableEMDISentencesShowGPSData?: boolean = undefined
  enableEMDIOverviewShowGPSData?: boolean = undefined
  enableEnforcementContacts?: boolean = undefined
}
