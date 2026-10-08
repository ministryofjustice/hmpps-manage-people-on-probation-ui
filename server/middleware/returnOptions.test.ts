import httpMocks from 'node-mocks-http'
import { returnOptions } from './returnOptions'

const nextSpy = jest.fn()

const providers = ['providers']
const teams = ['teams']
const users = ['users']

const req = httpMocks.createRequest({
  session: {
    data: {
      providers: {
        temp: {
          'user-1': providers,
        },
      },
      teams: {
        temp: {
          'user-1': teams,
        },
      },
      staff: {
        temp: {
          'user-1': users,
        },
      },
    },
  },
})
const res = httpMocks.createResponse({
  locals: {
    user: {
      username: 'user-1',
    },
  },
})

const spy = jest.spyOn(res, 'json')

describe('middleware/returnOptions', () => {
  it('should return the data values as json', () => {
    returnOptions(req, res, nextSpy)
    expect(spy).toHaveBeenCalledWith({ providers, teams, users })
  })
})
