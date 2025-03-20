import superagent, { Response } from 'superagent'

import homepage from './homepage'
import caseload from './caseload'
import userRoles from './userRoles'
import userSchedule from './userSchedule'
import interventions from './interventions'

export default {
  resetMocks: (): Promise<Array<Response>> =>
    Promise.all([superagent.post('http://localhost:9091/__admin/mappings/reset')]),
  ...homepage,
  ...caseload,
  ...userRoles,
  ...userSchedule,
  ...interventions,
}
