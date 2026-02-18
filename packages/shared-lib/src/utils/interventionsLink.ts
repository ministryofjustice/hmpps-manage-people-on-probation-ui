import { getConfig } from '../config'

export const interventionsLink = (referralId: string) => {
  const config = getConfig()
  if (!referralId) {
    return ''
  }
  return `${config.interventions.link}/probation-practitioner/referrals/${referralId}/progress`
}
