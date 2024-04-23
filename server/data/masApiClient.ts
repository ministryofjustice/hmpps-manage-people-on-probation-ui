import config from '../config'
import RestClient from './restClient'
import { Overview } from './model/overview'
import { PersonAppointment, Schedule } from './model/schedule'
import {
  CircumstanceOverview,
  DisabilityOverview,
  PersonalContact,
  PersonalDetails,
  ProvisionOverview,
} from './model/personalDetails'
import { AddressOverview, PersonSummary } from './model/common'
import { SentenceDetails } from './model/sentenceDetails'
import { PersonActivity } from './model/activityLog'
import { PersonRiskFlag, PersonRiskFlags } from './model/risk'
import { PersonCompliance } from './model/compliance'
import { PreviousOrderHistory } from './model/previousOrderHistory'
import { OffenceDetails } from './model/offenceDetails'

export default class MasApiClient extends RestClient {
  constructor(token: string) {
    super('Manage a Supervision API', config.apis.masApi, token)
  }

  async getOverview(crn: string): Promise<Overview | null> {
    return this.get({ path: `/overview/${crn}`, handle404: false })
  }

  async getSentenceDetails(crn: string): Promise<SentenceDetails | null> {
    return this.get({ path: `/sentence/${crn}`, handle404: false })
  }

  async getSentencePreviousOrders(crn: string): Promise<PreviousOrderHistory | null> {
    return this.get({ path: `/sentence/${crn}/previous-orders`, handle404: false })
  }

  async getSentenceOffences(crn: string, eventNumber: string): Promise<OffenceDetails | null> {
    return this.get({ path: `/sentence/${crn}/offences/${eventNumber}`, handle404: false })
  }

  async getPersonalDetails(crn: string): Promise<PersonalDetails | null> {
    return this.get({ path: `/personal-details/${crn}`, handle404: false })
  }

  async getPersonalContact(crn: string, id: string): Promise<PersonalContact | null> {
    return this.get({ path: `/personal-details/${crn}/personal-contact/${id}`, handle404: false })
  }

  async getPersonalAddresses(crn: string): Promise<AddressOverview | null> {
    return this.get({ path: `/personal-details/${crn}/addresses`, handle404: false })
  }

  async getPersonSummary(crn: string): Promise<PersonSummary | null> {
    return this.get({ path: `/personal-details/${crn}/summary`, handle404: false })
  }

  async getPersonDisabilities(crn: string): Promise<DisabilityOverview | null> {
    return this.get({ path: `/personal-details/${crn}/disabilities`, handle404: false })
  }

  async getPersonAdjustments(crn: string): Promise<ProvisionOverview | null> {
    return this.get({ path: `/personal-details/${crn}/provisions`, handle404: false })
  }

  async getPersonCircumstances(crn: string): Promise<CircumstanceOverview | null> {
    return this.get({ path: `/personal-details/${crn}/circumstances`, handle404: false })
  }

  async downloadDocument(crn: string, documentId: string): Promise<Response> {
    return this.get({ path: `/personal-details/${crn}/document/${documentId}`, raw: true, responseType: 'arrayBuffer' })
  }

  async getPersonSchedule(crn: string, type: string): Promise<Schedule> {
    return this.get({ path: `/schedule/${crn}/${type}`, handle404: false })
  }

  async getPersonAppointment(crn: string, appointmentId: string): Promise<PersonAppointment | null> {
    return this.get({ path: `/schedule/${crn}/appointment/${appointmentId}`, handle404: false })
  }

  async getPersonActivityLog(crn: string): Promise<PersonActivity> {
    return this.get({ path: `/activity/${crn}`, handle404: false })
  }

  async getPersonRiskFlags(crn: string): Promise<PersonRiskFlags> {
    return this.get({ path: `/risk-flags/${crn}`, handle404: false })
  }

  async getPersonRiskFlag(crn: string, id: string): Promise<PersonRiskFlag> {
    return this.get({ path: `/risk-flags/${crn}/${id}`, handle404: false })
  }

  async getPersonCompliance(crn: string): Promise<PersonCompliance> {
    return this.get({ path: `/compliance/${crn}`, handle404: false })
  }
}
