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
import caseDetail from './caseDetail'
import user from './user'
import eSupervisionAPI from './eSupervisionAPI'
import document from './document'
import overdueOutcomes from './overdueOutcomes'
import sentences from './sentences'
import enforcementActions from './enforcementActions'
import relatedContacts from './relatedContacts'
import compliance from './compliance'
import contactOutcomes from './contactOutcomes'
import emdi from './emdi'

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
  ...caseDetail,
  ...user,
  ...eSupervisionAPI,
  ...document,
  ...overdueOutcomes,
  ...sentences,
  ...enforcementActions,
  ...relatedContacts,
  ...compliance,
  ...contactOutcomes,
  ...emdi,
  stubBreachRecallInformation: (args: { data: string }): Promise<Response> =>
    superagent.post('http://localhost:9091/__admin/mappings').send({
      request: {
        method: 'GET',
        urlPattern: '/breachRecall',
      },
      response: {
        status: 200,
        body: args.data,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
}
