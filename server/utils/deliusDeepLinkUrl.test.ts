import { deliusDeepLinkUrl } from './deliusDeepLinkUrl'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/deliusDeepLinkUrl', () => {
  it.each([
    ['null', null, null, undefined, undefined, ''],
    [
      'present',
      'ContactList',
      '1234',
      undefined,
      undefined,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234',
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      'contact-id',
      undefined,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&contactID=contact-id',
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      undefined,
      'component-id',
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&componentId=component-id',
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      'contact-id',
      'component-id',
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&contactID=contact-id&componentId=component-id',
    ],
  ])(
    '%s deliusDeepLinkUrl(%s, %s)',
    (_: string, a: string, b: string, c: string | undefined, d: string | undefined, expected: string) => {
      expect(deliusDeepLinkUrl(a, b, c, d)).toEqual(expected)
    },
  )
})
