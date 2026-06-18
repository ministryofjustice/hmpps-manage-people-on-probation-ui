import config from '../config'

export const tierLink = (crn: string) => {
  if (!crn) {
    return ''
  }
  return `${config.tier.link}/${crn}`
}

export const tierUrlV3 = (crn: string) => {
  if (!crn) {
    return ''
  }
  return `${config.tierUrl.link}/v3/case/${crn}`
}
