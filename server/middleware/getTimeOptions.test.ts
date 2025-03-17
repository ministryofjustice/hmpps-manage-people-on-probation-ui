import httpMocks from 'node-mocks-http'
import { getTimeOptions } from './getTimeOptions'
import { AppResponse } from '../@types'

const req = httpMocks.createRequest()

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

describe('/middleware/getTimeOptions', () => {
  beforeEach(() => {
    getTimeOptions(req, res, nextSpy)
  })
  it('should assign the time options to res.locals.timeOptions', () => {
    expect(res.locals.timeOptions).toEqual([
      { text: 'Choose time', value: '' },
      { text: '9:00am' },
      { text: '9:15am' },
      { text: '9:30am' },
      { text: '9:45am' },
      { text: '10:00am' },
      { text: '10:15am' },
      { text: '10:30am' },
      { text: '10:45am' },
      { text: '11:00am' },
      { text: '11:15am' },
      { text: '11:30am' },
      { text: '11:45am' },
      { text: '12:00pm' },
      { text: '12:15pm' },
      { text: '12:30pm' },
      { text: '12:45pm' },
      { text: '1:00pm' },
      { text: '1:15pm' },
      { text: '1:30pm' },
      { text: '1:45pm' },
      { text: '2:00pm' },
      { text: '2:15pm' },
      { text: '2:30pm' },
      { text: '2:45pm' },
      { text: '3:00pm' },
      { text: '3:15pm' },
      { text: '3:30pm' },
      { text: '3:45pm' },
      { text: '4:00pm' },
      { text: '4:15pm' },
      { text: '4:30pm' },
      { text: '4:45pm' },
    ])
  })
})
