import config from '../config'
import { sentencePlanLink } from './sentencePlanLink'

describe('utils/sentencePlanLink', () => {
  it('should return the sentence plan link from config', () => {
    expect(sentencePlanLink()).toEqual(config.sentencePlan.link)
  })
  it('should return the sentence plan link from config', () => {
    expect(sentencePlanLink()).toEqual(config.sentencePlan.link)
  })
  it('should return the sentence plan link v2 from config', () => {
    expect(sentencePlanLink(true)).toEqual(config.sentencePlan.linkV2)
  })
})
