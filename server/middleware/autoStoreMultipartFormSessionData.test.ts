import httpMocks from 'node-mocks-http'
import { autoStoreMultipartFormSessionData } from './autoStoreMultipartFormSessionData'
import type { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'

const crn = 'X961494'
const id = 'd3ae351d-28d3-4a86-a886-35b78cdade91'

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

jest.mock('../data/hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const nextSpy = jest.fn()

describe('/middleware/autoStoreMultiformSessionData', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('parses multipart keys and updates session data accordingly', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      url: `/case/${crn}/reschedule/${id}`,
      params: {
        crn,
        id,
      },
      session: { data: { appointments: { [crn]: { [id]: {} } } } },
      body: {
        [`[appointments][${crn}][${id}][rescheduleAppointment][whoNeedsToReschedule]`]: 'POP',
        [`[appointments][${crn}][${id}][rescheduleAppointment][reason]`]: 'some reason',
        [`[appointments][${crn}][${id}][sensitivity]`]: 'Yes',
      },
    })

    await autoStoreMultipartFormSessionData(hmppsAuthClient)(req, res, nextSpy)

    // Session data should be updated with nested body
    expect(req.session.data.appointments[crn][id]).toEqual(
      expect.objectContaining({
        sensitivity: 'Yes',
        rescheduleAppointment: expect.objectContaining({
          whoNeedsToReschedule: 'POP',
          reason: 'some reason',
        }),
      }),
    )

    expect(nextSpy).toHaveBeenCalled()
  })
})
