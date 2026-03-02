import config from '../config'
import RestClient from './restClient'

export default class DeliusClient extends RestClient {
  constructor(token: string) {
    super('Delius Integration API', config.apis.deliusApi, token)
  }

  async getHomepage(username: string): Promise<Homepage> {
    return this.get({ path: `/user/${username}/homepage` })
  }
}

export interface Name {
  surname: string
  middleName?: string
  forename: string
}

export interface Homepage {
  upcomingAppointments: AppointmentSummary[]
  appointmentsRequiringOutcome: AppointmentSummary[]
  appointmentsRequiringOutcomeCount: number
}

export interface AppointmentSummary {
  crn: string
  name: Name
  id: number
  type: string
  startDateTime: string
  endDateTime?: string
  location?: string
  deliusManaged?: boolean
}
