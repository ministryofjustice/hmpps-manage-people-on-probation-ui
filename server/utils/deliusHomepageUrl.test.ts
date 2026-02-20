import { deliusHomepageUrl } from './deliusHomepageUrl'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/deliusHomepageUrl', () => {
  it.each([['Get link', 'https://ndelius-dummy-url']])(
    '%s deliusDeepLinkUrl(%s, %s)',
    (_: string, expected: string) => {
      expect(deliusHomepageUrl()).toEqual(expected)
    },
  )
})
