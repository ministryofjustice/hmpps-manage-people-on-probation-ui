import superagent, { Response } from 'superagent'

import caseload from './caseload'
import userRoles from './userRoles'
import userSchedule from './userSchedule'

export default {
  resetMocks: (): Promise<Array<Response>> =>
    Promise.all([superagent.post('http://localhost:9091/__admin/mappings/reset')]),
  ...caseload,
  ...userRoles,
  ...userSchedule,
}
