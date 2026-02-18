import { getConfig } from '../config'

export const sentencePlanLink = () => {
  const config = getConfig()
  return `${config.sentencePlan.link}`
}
