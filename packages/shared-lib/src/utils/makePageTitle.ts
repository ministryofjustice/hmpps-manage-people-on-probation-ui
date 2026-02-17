import config from '../config'

export const makePageTitle = ({ pageHeading }: { pageHeading: string | string[] }): string => {
  const titles = !Array.isArray(pageHeading) ? [pageHeading] : pageHeading
  return `${titles.join(' - ')} - ${config.applicationName}`
}
