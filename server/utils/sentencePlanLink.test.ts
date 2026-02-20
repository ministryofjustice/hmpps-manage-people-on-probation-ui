import config from '../config'
import { sentencePlanLink } from './sentencePlanLink'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/sentencePlanLink', () => {
  it('should return the sentence plan link from config', () => {
    expect(sentencePlanLink()).toEqual(config.sentencePlan.link)
  })
})
