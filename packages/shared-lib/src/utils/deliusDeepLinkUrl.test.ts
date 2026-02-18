import { deliusDeepLinkUrl } from './deliusDeepLinkUrl'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockLink = 'https://ndelius-dummy-url'

const mockedConfig = {
  delius: {
    link: mockLink,
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('utils/deliusDeepLinkUrl', () => {
  it.each([
    ['null', null, null, undefined, undefined, ''],
    [
      'present',
      'ContactList',
      '1234',
      undefined,
      undefined,
      `${mockLink}/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234`,
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      'contact-id',
      undefined,
      `${mockLink}/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&contactID=contact-id`,
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      undefined,
      'component-id',
      `${mockLink}/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&componentId=component-id`,
    ],
    [
      'contactId',
      'ContactList',
      '1234',
      'contact-id',
      'component-id',
      `${mockLink}/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=1234&contactID=contact-id&componentId=component-id`,
    ],
  ])(
    '%s deliusDeepLinkUrl(%s, %s)',
    (_: string, a: string, b: string, c: string | undefined, d: string | undefined, expected: string) => {
      expect(deliusDeepLinkUrl(a, b, c, d)).toEqual(expected)
    },
  )
})
