import { getConfig } from '../config'

export const makePageTitle = ({ pageHeading }: { pageHeading: string | string[] }): string => {
  const config = getConfig()
  const titles = !Array.isArray(pageHeading) ? [pageHeading] : pageHeading
  return `${titles.join(' - ')} - ${config.applicationName}`
}
