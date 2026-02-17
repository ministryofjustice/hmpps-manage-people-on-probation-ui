import { makePageTitle } from './makePageTitle'
import config from '../config'

describe('makePageTitle()', () => {
  it('should format the title correctly if heading is a single string value', () => {
    expect(makePageTitle({ pageHeading: 'Home' })).toEqual(`Home - ${config.applicationName}`)
  })
  it('should format the title correctly if heading is an array containing two values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Personal details'] })).toEqual(
      `Contact - Personal details - ${config.applicationName}`,
    )
  })
  it('should format the title correctly if heading is an array containing three values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Sentence', 'Licence condition'] })).toEqual(
      `Contact - Sentence - Licence condition - ${config.applicationName}`,
    )
  })
})
