import httpMocks from 'node-mocks-http'
import getPaginationLinks from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { mockAppResponse } from './mocks'
import { EnforcementContactsResponse } from '../data/model/schedule'
import { checkSendAuditMessage } from './testutils'
import { SubjectType } from '../middleware/sendAuditMessage'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const mockResponse = {
  size: 25,
  page: 0,
  totalResults: 2,
  totalPages: 1,
  enforcementContacts: [
    {
      caseName: { forename: 'Eula', middleName: '', surname: 'Schmeler' },
      id: 1,
      crn: 'X801756',
      dob: '1986-07-19',
      appointmentType: 'Home visit',
      appointmentDate: '2024-01-15',
      appointmentOutcome: 'FTCA',
      enforcementAction: 'WL',
      evidenceDueDate: '2024-02-15',
      deliusManaged: true,
    },
    {
      caseName: { forename: 'John', middleName: '', surname: 'Doe' },
      id: 2,
      crn: 'X801758',
      dob: '2001-08-24',
      appointmentType: '3 Way Meeting (Non NS)',
      appointmentDate: '2024-01-20',
      appointmentOutcome: 'FTCA',
      enforcementAction: 'WL',
      evidenceDueDate: '2024-02-20',
      deliusManaged: false,
    },
  ],
} as unknown as EnforcementContactsResponse

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const token = { access_token: 'token-1', expires_in: 300 }

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')

describe('enforcementAction controller', () => {
  const getEnforcementContactsSpy = jest
    .spyOn(MasApiClient.prototype, 'getEnforcementContacts')
    .mockImplementation(() => Promise.resolve(mockResponse))

  describe('getAllEnforcementContacts', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should render the enforcement action page with no sort filter', async () => {
      const expectedSortByOrder = {
        surname: 'none',
        details: 'none',
        outcome: 'none',
        action: 'none',
      }

      const req = httpMocks.createRequest({
        query: {
          page: '1',
        },
        url: '/caseload/my-enforcement-actions',
        session: { backLink: '/back' },
      })

      await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

      expect(getEnforcementContactsSpy).toHaveBeenCalledWith('user-1', '0', '25', '', '')
      expect(renderSpy).toHaveBeenCalledWith('pages/my-enforcement-actions', {
        enforcementContacts: mockResponse,
        sortByOrder: expectedSortByOrder,
        sortUrl: '/caseload/my-enforcement-actions',
        pagination: getPaginationLinks(
          1,
          mockResponse.totalPages,
          mockResponse.totalResults,
          page => addParameters(req, { page: page.toString() }),
          mockResponse.size,
        ),
        backLink: '/back',
      })
    })

    test.each`
      sortFilter        | expectedSortByOrder                                                            | expectedSortBy | expectedAscending
      ${'surname.asc'}  | ${{ surname: 'ascending', details: 'none', outcome: 'none', action: 'none' }}  | ${'surname'}   | ${'true'}
      ${'surname.desc'} | ${{ surname: 'descending', details: 'none', outcome: 'none', action: 'none' }} | ${'surname'}   | ${'false'}
      ${'details.asc'}  | ${{ surname: 'none', details: 'ascending', outcome: 'none', action: 'none' }}  | ${'details'}   | ${'true'}
      ${'details.desc'} | ${{ surname: 'none', details: 'descending', outcome: 'none', action: 'none' }} | ${'details'}   | ${'false'}
      ${'outcome.asc'}  | ${{ surname: 'none', details: 'none', outcome: 'ascending', action: 'none' }}  | ${'outcome'}   | ${'true'}
      ${'outcome.desc'} | ${{ surname: 'none', details: 'none', outcome: 'descending', action: 'none' }} | ${'outcome'}   | ${'false'}
      ${'action.asc'}   | ${{ surname: 'none', details: 'none', outcome: 'none', action: 'ascending' }}  | ${'action'}    | ${'true'}
      ${'action.desc'}  | ${{ surname: 'none', details: 'none', outcome: 'none', action: 'descending' }} | ${'action'}    | ${'false'}
    `(
      'should render the enforcement action page with sort filter $sortFilter',
      async ({ sortFilter, expectedSortByOrder, expectedSortBy, expectedAscending }) => {
        const req = httpMocks.createRequest({
          query: {
            page: '1',
            sortBy: sortFilter,
          },
          url: `/caseload/my-enforcement-actions?sortBy=${sortFilter}`,
          session: { backLink: null },
        })

        await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

        expect(getEnforcementContactsSpy).toHaveBeenCalledWith('user-1', '0', '25', expectedSortBy, expectedAscending)
        expect(renderSpy).toHaveBeenCalledWith(
          'pages/my-enforcement-actions',
          expect.objectContaining({ sortByOrder: expectedSortByOrder }),
        )
      },
    )

    it('should send an audit message with the correct data', async () => {
      const req = httpMocks.createRequest({
        query: { page: '1' },
        url: '/caseload/my-enforcement-actions',
        session: { backLink: null },
      })

      await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

      checkSendAuditMessage(res, 'VIEW_MAS_ALL_ENFORCEMENT_ACTIONS', 'user-1', SubjectType.USER)
    })

    describe('pagination', () => {
      test.each`
        pageNumber | pageLabel
        ${'1'}     | ${'first page'}
        ${'4'}     | ${'middle page'}
        ${'8'}     | ${'last page'}
      `('should calculate correct pagination for $pageLabel', async ({ pageNumber }) => {
        const req = httpMocks.createRequest({
          query: { page: pageNumber },
          url: `/caseload/my-enforcement-actions?page=${pageNumber}`,
          session: { backLink: null },
        })

        await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

        expect(renderSpy).toHaveBeenCalledWith(
          'pages/my-enforcement-actions',
          expect.objectContaining({
            pagination: expect.anything(),
          }),
        )
        expect(getEnforcementContactsSpy).toHaveBeenCalledWith(
          'user-1',
          expect.anything(),
          '25',
          expect.anything(),
          expect.anything(),
        )
      })
    })
  })
})
