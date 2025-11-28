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
import userLocations from './userLocations'
import activityLog from './activityLog'
import risk from './risk'
import supervisionAppointmentClient from './supervisionAppointmentClient'
import probationFEIntegration from './probationFEIntegration'
import alerts from './alerts'
import eSupervisionAPI from './eSupervisionAPI'

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
  ...userLocations,
  ...activityLog,
  ...risk,
  ...supervisionAppointmentClient,
  ...probationFEIntegration,
  ...alerts,
  ...eSupervisionAPI,
}
