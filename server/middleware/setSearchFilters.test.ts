import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../controllers/mocks'
import { setSearchFilters } from './setSearchFilters'

const res = mockAppResponse()
const req = httpMocks.createRequest({
  session: {},
  params: {
    prisonerId: 'prisoner-1',
  },
  user: {
    username: 'user1',
  },
  body: {
    providers: [],
    matchAllTerms: false,
  },
})
const sendSpy = jest.spyOn(res, 'sendStatus')

describe('setFilters', () => {
  it(`should set filters in session`, async () => {
    setSearchFilters()(req, res)
    expect(req.session.probationSearch).toEqual(req.body)
    expect(sendSpy).toHaveBeenCalledWith(200)
  })
})
