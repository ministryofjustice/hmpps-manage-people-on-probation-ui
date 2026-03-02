import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { HmppsAuthClient } from '../data'

const crn = 'X000001'

describe('addContactController', () => {
  const hmppsAuthClient = {
    getSystemClientToken: jest.fn().mockResolvedValue('test-token'),
  } as unknown as HmppsAuthClient

  describe('getFrequentlyUsedContact', () => {
    const req = httpMocks.createRequest({
      params: { crn },
      query: { back: '/previous-page' },
      url: '/case/X000001/add-frequently-used-contact',
    })

    const res = mockAppResponse({
      locals: {
        user: { username: 'TEST_USER' },
        csrfToken: 'csrf-token',
        deliusDeepLinkUrl: jest.fn().mockReturnValue('http://delius-link'),
      },
    })

    const renderSpy = jest.spyOn(res, 'render')

    beforeEach(async () => {
      jest.clearAllMocks()
      await controllers.addContact.getFrequentlyUsedContact(hmppsAuthClient)(req, res)
    })

    it.skip('should render the add-frequently-used-contact page with the correct data', () => {
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/contacts/add-frequently-used-contact',
        expect.objectContaining({
          crn,
          csrfToken: 'csrf-token',
          contactLogUrl: `/case/${crn}/activity-log/`,
        }),
      )
    })
  })
})
