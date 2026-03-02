import MasApiClient from '../data/masApiClient'
import { ContactType, PersonOnProbation, CreateContactRequest } from '../data/model/contacts'
import config from '../config'

export default class ContactService {
  constructor(private readonly masApiClient: MasApiClient) {}

  async getPersonOnProbation(crn: string): Promise<PersonOnProbation> {
    // Reusing the existing getPersonSummary method in MasApiClient
    // Assuming PersonSummary maps to PersonOnProbation or they are the same type
    return this.masApiClient.getPersonSummary(crn)
  }

  async getFrequentContactTypes(): Promise<ContactType[]> {
    return this.masApiClient.getFrequentContactTypes()
  }

  async getContactType(code: string): Promise<ContactType> {
    return this.masApiClient.getContactType(code)
  }

  async isResponsibleOfficer(username: string, crn: string): Promise<boolean> {
    return this.masApiClient.isResponsibleOfficer(username, crn)
  }

  async createContact(crn: string, payload: CreateContactRequest): Promise<void> {
    return this.masApiClient.createContact(crn, payload)
  }

  getNdeliusContactUrl(crn: string): string {
    // This logic remains in the service as it's a config/url construction, not an API call
    return `${config.delius.link}/NDelius-war/delius/JSP/deeplink.jsp?component=ContactList&offenderId=${crn}`
  }
}
