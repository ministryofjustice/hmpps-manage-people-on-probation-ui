import { getConfig } from '../config'

export const tierLink = (crn: string) => {
  const config = getConfig()
  if (!crn) {
    return ''
  }
  return `${config.tier.link}/${crn}`
}
