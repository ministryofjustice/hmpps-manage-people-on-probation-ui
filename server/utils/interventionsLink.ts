import config from '../config'

export const interventionsLink = (referralId: string) => {
  if (!referralId) {
    return ''
  }
  return `${config.interventions.link}/probation-practitioner/referrals/${referralId}/progress`
}
