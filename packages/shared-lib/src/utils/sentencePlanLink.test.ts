import { sentencePlanLink } from './sentencePlanLink'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockLink = 'https://sentence-plan-dummy-url'

const mockedConfig = {
  sentencePlan: {
    link: mockLink,
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)
describe('utils/sentencePlanLink', () => {
  it('should return the sentence plan link from config', () => {
    expect(sentencePlanLink()).toEqual(mockLink)
  })
})
