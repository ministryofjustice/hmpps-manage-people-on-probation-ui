import { makePageTitle } from './makePageTitle'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const applicationName = 'Manage people on probation'

const mockedConfig = {
  applicationName,
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('makePageTitle()', () => {
  it('should format the title correctly if heading is a single string value', () => {
    expect(makePageTitle({ pageHeading: 'Home' })).toEqual(`Home - ${applicationName}`)
  })
  it('should format the title correctly if heading is an array containing two values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Personal details'] })).toEqual(
      `Contact - Personal details - ${applicationName}`,
    )
  })
  it('should format the title correctly if heading is an array containing three values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Sentence', 'Licence condition'] })).toEqual(
      `Contact - Sentence - Licence condition - ${applicationName}`,
    )
  })
})
