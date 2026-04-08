import config from '../config'

export const sentencePlanLink = (enableV2 = false) => {
  return enableV2 ? `${config.sentencePlan.linkV2}` : `${config.sentencePlan.link}`
}
