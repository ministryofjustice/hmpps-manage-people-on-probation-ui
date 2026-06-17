import config from '../config'
import { sentencePlanLink } from './sentencePlanLink'

describe('utils/sentencePlanLink', () => {
  it('should return the sentence plan link v2 from config', () => {
    expect(sentencePlanLink()).toEqual(config.sentencePlan.linkV2)
  })
})
