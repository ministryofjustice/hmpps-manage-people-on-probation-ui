import httpMocks from 'node-mocks-http'
import { deleteOutcomeVars } from './deleteOutcomeVars'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'

const req = httpMocks.createRequest({
  session: {
    data: {
      temp: {
        [crn]: {
          linkedContactId: '1234',
          nextAppointmentId: '5678',
        },
      },
    },
  },
})

const res = mockAppResponse()

describe('/middleware/appointment-outcomes/deleteOutcomeVars', () => {
  it('should delete linkedContactId and nextAppointmentId session vars if set', () => {
    deleteOutcomeVars(crn)(req, res)
    expect(req.session.data.temp[crn].linkedContactId).toBeUndefined()
    expect(req.session.data.temp[crn].nextAppointmentId).toBeUndefined()
  })
})
