import config from '../config'

export const deliusDeepLinkUrl = (component: string, crn: string, contactId?: string, componentId?: string) => {
  if (!component || !crn) {
    return ''
  }
  const idParamKey = component === 'DrugHistory' || component === 'UPWWorksheet' ? 'EventNumber' : 'contactID'
  const idParam = contactId ? `&${idParamKey}=${contactId}` : ''
  const componentIdParam = componentId ? `&componentId=${componentId}` : ''
  return `${config.delius.link}/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=${crn}${idParam}${componentIdParam}`
}

export const deepLinkContactTypes = [
  'CP/UPW - Appointment/Attendance (NS)',
  'Drug Test (Approved Premises)',
  'Drug Test (DRR)',
  'Drug Test (Licence Condition)',
  'Drug Test Details',
  'Drug Testing Referral',
  'Drug Testing Assessment',
  'Drug Test Appointment (NS)',
]
