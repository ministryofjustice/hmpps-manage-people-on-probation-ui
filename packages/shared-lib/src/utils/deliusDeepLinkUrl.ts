import config from '../config'

export const deliusDeepLinkUrl = (component: string, crn: string, contactId?: string, componentId?: string) => {
  if (!component || !crn) {
    return ''
  }
  const contactIdParam = contactId ? `&contactID=${contactId}` : ''
  const componentIdParam = componentId ? `&componentId=${componentId}` : ''
  return `${config.delius.link}/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=${crn}${contactIdParam}${componentIdParam}`
}
