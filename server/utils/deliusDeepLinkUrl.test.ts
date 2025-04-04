import { deliusDeepLinkUrl } from './deliusDeepLinkUrl'

describe('utils/deliusDeepLinkUrl', () => {
  it.each([
    ['null', null, null, ''],
    [
      'present',
      'ContactList',
      '1234',
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234',
    ],
  ])('%s deliusDeepLinkUrl(%s, %s)', (_: string, a: string, b: string, expected: string) => {
    expect(deliusDeepLinkUrl(a, b)).toEqual(expected)
  })
})
