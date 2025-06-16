import superagent, { Response } from 'superagent'

import homepage from './homepage'
import caseload from './caseload'
import userRoles from './userRoles'
import userSchedule from './userSchedule'
import interventions from './interventions'
import personalDetails from './personalDetails'
import flags from './flags'
import appointments from './appointments'
import overview from './overview'

export default {
  resetMocks: (): Promise<Array<Response>> =>
    Promise.all([superagent.post('http://localhost:9091/__admin/mappings/reset')]),
  ...homepage,
  ...caseload,
  ...userRoles,
  ...userSchedule,
  ...interventions,
  ...personalDetails,
  ...flags,
  ...appointments,
  ...overview,
}
