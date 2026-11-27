import config from '../config'

export const tierLink = (crn: string) => {
  if (!crn) {
    return ''
  }
  return `${config.tier.link}/${crn}`
}
