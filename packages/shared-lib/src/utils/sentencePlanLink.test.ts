import config from '../config'
import { sentencePlanLink } from './sentencePlanLink'

describe('utils/sentencePlanLink', () => {
  it('should return the sentence plan link from config', () => {
    expect(sentencePlanLink()).toEqual(config.sentencePlan.link)
  })
})
