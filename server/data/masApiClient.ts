import { Response } from 'superagent'
import config from '../config'
import RestClient from './restClient'
import { Overview } from './model/overview'
import { PersonAppointment, Schedule } from './model/schedule'
import {
  CircumstanceOverview,
  DisabilityOverview,
  PersonalContact,
  PersonalDetails,
  PersonalDetailsMainAddress,
  PersonalDetailsUpdateRequest,
  ProvisionOverview,
  AddressOverview,
  AddressOverviewSummary,
  PersonSummary,
} from './model/personalDetails'
import { SentenceDetails, Sentences } from './model/sentenceDetails'
import { PersonActivity } from './model/activityLog'
import { PersonRiskFlag, PersonRiskFlags } from './model/risk'
import { PersonCompliance } from './model/compliance'
import { PreviousOrderHistory } from './model/previousOrderHistory'
import { Offences } from './model/offences'
import { TeamCaseload, UserAppontment, UserCaseload, UserLocations, UserProviders, UserTeam } from './model/caseload'
import { ProfessionalContact } from './model/professionalContact'
import { LicenceConditionNoteDetails } from './model/licenceConditionNoteDetails'
import { RequirementNoteDetails } from './model/requirementNoteDetails'
import { PreviousOrderDetail } from './model/previousOrderDetail'
import { CaseAccess, UserAccess } from './model/caseAccess'
import { DeliusRoles } from './model/deliusRoles'
import { UserSchedule } from './model/userSchedule'
import { PersonDocuments, SearchDocumentsRequest, TextSearchDocumentsRequest } from './model/documents'
import { ActivityLogRequestBody } from '../models/ActivityLog'
import {
  AppointmentChecks,
  AppointmentRequestBody,
  CheckAppointment,
  AppointmentTypeResponse,
  AppointmentPatch,
  NextAppointmentResponse,
  AppointmentsPostResponse,
  MasUserDetails,
  RescheduleAppointmentResponse,
  RescheduleAppointmentRequestBody,
  SmsPreviewRequest,
  SmsPreviewResponse,
} from '../models/Appointments'
import { UserAlerts, UserAlertsContent } from '../models/Alerts'
import { ContactResponse } from './model/overdueOutcomes'
import { ProbationPractitioner } from '../models/CaseDetail'
import { AppointmentStaff, AppointmentTeams } from './model/appointment'
import { ErrorSummary } from './model/common'

interface GetUserScheduleProps {
  username: string
  page: string
  sortBy: string
  ascending: string
  size: string
  type: string
}

export default class MasApiClient extends RestClient {
  constructor(token: string) {
    super('Manage a Supervision API', config.apis.masApi, token)
  }

  async getOverview(crn: string, sentenceNumber = '1'): Promise<Overview | null> {
    const queryParam = `?sentenceNumber=${sentenceNumber}`
    return this.get({ path: `/overview/${crn}${queryParam}`, handle404: false })
  }

  async getOverdueOutcomes(crn: string): Promise<ContactResponse | null> {
    return this.get({ path: `/appointment/${crn}/overdue-outcomes`, handle404: false })
  }

  async getSentenceDetails(crn: string, queryParam = ''): Promise<SentenceDetails | null> {
    return this.get({ path: `/sentence/${crn}${queryParam}`, handle404: false })
  }

  async getSentences(crn: string, number = '', includeRarRequirements = true): Promise<Sentences | null> {
    let queryParameters = number || !includeRarRequirements ? '?' : ''
    if (queryParameters) {
      if (number) queryParameters = `${queryParameters}number=${number}`
      if (!includeRarRequirements) {
        if (number) queryParameters = `${queryParameters}&`
        queryParameters = `${queryParameters}includeRarRequirements=false`
      }
    }
    return this.get({ path: `/sentences/${crn}${queryParameters}`, handle500: true, handle404: false })
  }

  async getProbationHistory(crn: string): Promise<SentenceDetails | null> {
    return this.get({ path: `/sentence/${crn}/probation-history`, handle404: false })
  }

  async getSentencePreviousOrders(crn: string): Promise<PreviousOrderHistory | null> {
    return this.get({ path: `/sentence/${crn}/previous-orders`, handle404: false })
  }

  async getSentencePreviousOrder(crn: string, eventNumber: string): Promise<PreviousOrderDetail | null> {
    return this.get({ path: `/sentence/${crn}/previous-orders/${eventNumber}`, handle404: false })
  }

  async getSentenceOffences(crn: string, eventNumber: string): Promise<Offences | null> {
    return this.get({ path: `/sentence/${crn}/offences/${eventNumber}`, handle404: false })
  }

  async getSentenceLicenceConditionNote(
    crn: string,
    licenceConditionId: string,
    noteId: string,
  ): Promise<LicenceConditionNoteDetails | null> {
    return this.get({
      path: `/sentence/${crn}/licence-condition/${licenceConditionId}/note/${noteId}`,
      handle404: false,
    })
  }

  async getSentenceRequirementNote(
    crn: string,
    requirementId: string,
    noteId: string,
  ): Promise<RequirementNoteDetails | null> {
    return this.get({
      path: `/sentence/${crn}/requirement/${requirementId}/note/${noteId}`,
      handle404: false,
    })
  }

  async getContacts(crn: string): Promise<ProfessionalContact | null> {
    return this.get({ path: `/sentence/${crn}/contacts`, handle404: false })
  }

  async getPersonalDetails(crn: string): Promise<PersonalDetails | null> {
    return this.get({ path: `/personal-details/${crn}`, handle404: false })
  }

  async updatePersonalDetailsContact(crn: string, body: PersonalDetailsUpdateRequest): Promise<PersonalDetails | null> {
    return this.post({
      data: body,
      path: `/personal-details/${crn}/contact`,
      handle404: false,
      handle500: false,
    })
  }

  async updatePersonalDetailsAddress(crn: string, body: PersonalDetailsUpdateRequest): Promise<PersonalDetails | null> {
    return this.post({
      data: body,
      path: `/personal-details/${crn}/address`,
      handle404: true,
      handle500: true,
    })
  }

  async getPersonalContact(crn: string, id: string): Promise<PersonalContact | null> {
    return this.get({ path: `/personal-details/${crn}/personal-contact/${id}`, handle404: false })
  }

  async getPersonalContactNote(crn: string, id: string, noteId: string): Promise<PersonalContact | null> {
    return this.get({ path: `/personal-details/${crn}/personal-contact/${id}/note/${noteId}`, handle404: false })
  }

  async getMainAddressNote(crn: string, noteId: string): Promise<PersonalDetailsMainAddress | null> {
    return this.get({ path: `/personal-details/${crn}/main-address/note/${noteId}`, handle404: false })
  }

  async getPersonalAddresses(crn: string): Promise<AddressOverview | null> {
    return this.get({ path: `/personal-details/${crn}/addresses`, handle404: false })
  }

  async getPersonalAddressesNote(
    crn: string,
    addressId: string,
    noteId: string,
  ): Promise<AddressOverviewSummary | null> {
    return this.get({ path: `/personal-details/${crn}/addresses/${addressId}/note/${noteId}`, handle404: false })
  }

  async getPersonSummary(crn: string): Promise<PersonSummary | null> {
    return this.get({ path: `/personal-details/${crn}/summary`, handle404: false })
  }

  async getPersonDisabilities(crn: string): Promise<DisabilityOverview | null> {
    return this.get({ path: `/personal-details/${crn}/disabilities`, handle404: false })
  }

  async getPersonDisabilityNote(crn: string, disabilityId: string, noteId: string): Promise<DisabilityOverview | null> {
    return this.get({ path: `/personal-details/${crn}/disability/${disabilityId}/note/${noteId}`, handle404: false })
  }

  async getPersonAdjustments(crn: string): Promise<ProvisionOverview | null> {
    return this.get({ path: `/personal-details/${crn}/provisions`, handle404: false })
  }

  async getPersonAdjustmentNote(crn: string, adjustmentId: string, noteId: string): Promise<ProvisionOverview | null> {
    return this.get({ path: `/personal-details/${crn}/provisions/${adjustmentId}/note/${noteId}`, handle404: false })
  }

  async getPersonCircumstances(crn: string): Promise<CircumstanceOverview | null> {
    return this.get({ path: `/personal-details/${crn}/circumstances`, handle404: false })
  }

  async getPersonCircumstanceNote(
    crn: string,
    circumstanceId: string,
    noteId: string,
  ): Promise<CircumstanceOverview | null> {
    return this.get({
      path: `/personal-details/${crn}/circumstances/${circumstanceId}/note/${noteId}`,
      handle404: false,
    })
  }

  async downloadDocument(crn: string, documentId: string): Promise<Response> {
    return this.get({ path: `/personal-details/${crn}/document/${documentId}`, raw: true, responseType: 'arrayBuffer' })
  }

  async getPersonSchedule(crn: string, type: string, page: string, sortQuery?: string): Promise<Schedule> {
    const queryParameters = `?${new URLSearchParams({ size: '10', page }).toString()}${sortQuery ?? ''}`
    return this.get({ path: `/schedule/${crn}/${type}${queryParameters}`, handle404: false })
  }

  async getPersonAppointment(crn: string, appointmentId: string): Promise<PersonAppointment | null> {
    return this.get({ path: `/schedule/${crn}/appointment/${appointmentId}`, handle404: false })
  }

  async getPersonAppointmentNote(
    crn: string,
    appointmentId: string,
    noteId: string,
  ): Promise<PersonAppointment | null> {
    return this.get({ path: `/schedule/${crn}/appointment/${appointmentId}/note/${noteId}`, handle404: false })
  }

  async postPersonActivityLog(crn: string, body: ActivityLogRequestBody, page: string): Promise<PersonActivity | null> {
    const pageQuery = `?${new URLSearchParams({ size: '10', page }).toString()}`
    return this.post({
      data: body,
      path: `/activity/${crn}${pageQuery}`,
      handle404: false,
      handle500: false,
    })
  }

  async getPersonRiskFlags(crn: string): Promise<PersonRiskFlags> {
    return this.get({
      path: `/risk-flags/${crn}`,
      handle404: false,
      handle500: true,
      errorMessage: 'Risk flag information is currently unavailable. Try again later or use NDelius.',
    })
  }

  async getDocuments(crn: string, page: string, sortBy: string): Promise<PersonDocuments> {
    const pageQuery = `?${new URLSearchParams({ size: '15', page, sortBy }).toString()}`
    return this.get({ path: `/documents/${crn}${pageQuery}`, handle404: true })
  }

  async patchDocuments(
    crn: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<{ statusCode: number } | ErrorSummary | null> {
    return this.patch({
      path: `/documents/${crn}/update/contact/${id}`,
      handle404: true,
      handle415: true,
      handle500: true,
      isMultipart: true,
      file,
      errorMessage: 'Upload failed. Please try again later',
    })
  }

  async textSearchDocuments(
    crn: string,
    page: string,
    request: TextSearchDocumentsRequest,
    sortBy?: string,
  ): Promise<PersonDocuments> {
    const pageQuery = `?useDBFilenameSearch=true&${sortBy ? new URLSearchParams({ size: '15', page, sortBy }).toString() : new URLSearchParams({ size: '15', page }).toString()}`
    return this.post({ path: `/documents/${crn}/search/text${pageQuery}`, data: request, handle404: false })
  }

  async searchDocuments(
    crn: string,
    page: string,
    sortBy: string,
    request: SearchDocumentsRequest,
  ): Promise<PersonDocuments> {
    const pageQuery = `?${new URLSearchParams({ size: '15', page, sortBy }).toString()}`
    return this.post({ path: `/documents/${crn}/search${pageQuery}`, data: request, handle404: false })
  }

  async getPersonRiskFlag(crn: string, id: string): Promise<PersonRiskFlag> {
    return this.get({ path: `/risk-flags/${crn}/${id}`, handle404: false })
  }

  async getPersonRiskFlagSingleNote(crn: string, id: string, noteId: string): Promise<PersonRiskFlag> {
    return this.get({ path: `/risk-flags/${crn}/${id}/note/${noteId}`, handle404: false })
  }

  async getPersonRiskRemovalFlagSingleNote(crn: string, id: string, noteId: string): Promise<PersonRiskFlag> {
    return this.get({ path: `/risk-flags/${crn}/${id}/risk-removal-note/${noteId}`, handle404: false })
  }

  async getPersonCompliance(crn: string): Promise<PersonCompliance> {
    return this.get({ path: `/compliance/${crn}`, handle404: false })
  }

  async postAppointments(crn: string, body: AppointmentRequestBody): Promise<AppointmentsPostResponse> {
    return this.post({
      data: body,
      path: `/appointment/${crn}`,
    })
  }

  async putRescheduleAppointment(
    id: string,
    body: RescheduleAppointmentRequestBody,
  ): Promise<RescheduleAppointmentResponse> {
    return this.put({
      data: body,
      path: `/appointments/${id}/recreate`,
    })
  }

  async checkAppointments(crn: string, body: CheckAppointment): Promise<AppointmentChecks> {
    return this.post({
      data: body,
      path: `/appointment/${crn}/check`,
      handle404: true,
      handle500: true,
    })
  }

  async patchAppointment(body: AppointmentPatch): Promise<PersonAppointment> {
    return this.patch({
      data: body,
      path: `/appointment`,
    })
  }

  async searchUserCaseload(
    username: string,
    page = '',
    sortBy = '',
    body: Record<never, never> = {},
  ): Promise<UserCaseload> {
    const searchParams: Record<string, string> = { size: '10' }
    if (page) searchParams.page = page
    if (sortBy) searchParams.sortBy = sortBy
    const pageQuery = `?${new URLSearchParams(searchParams).toString()}`
    return this.post({ data: body, path: `/caseload/user/${username}/search${pageQuery}`, handle404: true })
  }

  async getUserAppointments(username: string): Promise<UserAppontment> {
    return this.get({ path: `/user/${username}/appointments` })
  }

  async getUserTeams(username: string): Promise<UserTeam> {
    return this.get({ path: `/caseload/user/${username}/teams`, handle404: true })
  }

  async getUserProviders(username: string, regionCode?: string, teamCode?: string): Promise<UserProviders> {
    const teamQueryParam = teamCode ? `&team=${teamCode}` : ''
    const queryParameters = regionCode ? `?region=${regionCode}${teamQueryParam}` : ''
    return this.get({ path: `/user/${username}/providers${queryParameters}`, handle404: true })
  }

  async getTeamsByProvider(providerCode: string): Promise<AppointmentTeams> {
    return this.get({ path: `/appointment/teams/provider/${providerCode}` })
  }

  async getStaffByTeam(teamCode: string): Promise<AppointmentStaff> {
    return this.get({ path: `/appointment/staff/team/${teamCode}` })
  }

  async getUserLocations(username: string): Promise<UserLocations> {
    return this.get({ path: `/user/${username}/locations`, handle404: true })
  }

  async getOfficeLocationsByTeamAndProvider(providerCode: string, teamCode: string): Promise<UserLocations> {
    const query = `?${new URLSearchParams({ providerCode, teamCode }).toString()}`
    return this.get({ path: `/appointment/location/provider/${providerCode}/team/${teamCode}`, handle404: true })
  }

  async getUserSchedule({
    username,
    page,
    sortBy,
    ascending,
    size,
    type = 'upcoming',
  }: GetUserScheduleProps): Promise<UserSchedule> {
    const searchParams = Object.fromEntries(
      Object.entries({ size, page, sortBy, ascending }).filter(([_k, v]) => v),
    ) as Record<string, string>
    const pageQuery = `${new URLSearchParams(searchParams).toString()}`
    return this.get({
      path: `/user/${username}/schedule/${type}${pageQuery ? '?' : ''}${pageQuery}`,
      handle404: false,
      handle500: false,
    })
  }

  async getTeamCaseload(teamCode: string, page: string): Promise<TeamCaseload> {
    let pageQuery = '?size=10'
    if (page) {
      pageQuery = `${pageQuery}&page=${page}`
    }
    return this.get({ path: `/caseload/team/${teamCode}${pageQuery}`, handle404: true })
  }

  async getUserAccess(username: string, crn: string): Promise<CaseAccess> {
    return this.get({ path: `/user/${username}/access/${crn}`, handle404: false })
  }

  async checkUserAccess(username: string, crns: Record<never, never>): Promise<UserAccess> {
    return this.post({ data: crns, path: `/user/${username}/access`, handle404: false })
  }

  async getDeliusRoles(username: string): Promise<DeliusRoles> {
    return this.get({ path: `/user/${username}`, handle404: true })
  }

  async getAppointmentTypes(): Promise<AppointmentTypeResponse> {
    return this.get({ path: `/appointment/types`, handle404: false })
  }

  async getNextAppointment(username: string, crn: string, contactId: string): Promise<NextAppointmentResponse> {
    return this.get({ path: `/schedule/${crn}/next-appointment?username=${username}&contactId=${contactId}` })
  }

  async getUserDetails(username: string): Promise<MasUserDetails | null> {
    return this.get({ path: `/user/${username}`, handle404: true })
  }

  async getUserAlerts(page?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<UserAlerts> {
    let pageQuery = '?size=10'
    if (page !== undefined) {
      pageQuery = `${pageQuery}&page=${page}`
    }
    if (sortBy && sortOrder) {
      pageQuery = `${pageQuery}&sort=${sortBy}%2C${sortOrder}`
    }
    return this.get({ path: `/alerts${pageQuery}`, handle404: true })
  }

  async getUserAlertNote(alertId: string, noteId: string): Promise<UserAlertsContent> {
    return this.get({ path: `/alerts/${alertId}/notes/${noteId}`, handle404: false })
  }

  async getUserAlertsCount(): Promise<number> {
    const response: UserAlerts = await this.get({ path: `/alerts`, handle404: true })
    return response.totalResults
  }

  async clearAlerts(alertIds: number[]) {
    return this.put({
      path: '/alerts',
      data: { alertIds },
    })
  }

  async getProbationPractitioner(crn: string): Promise<ProbationPractitioner> {
    return this.get({ path: `/case/${crn}/probation-practitioner` })
  }

  async postSmsPreview(body: SmsPreviewRequest): Promise<SmsPreviewResponse | ErrorSummary | null> {
    return this.post({
      data: body,
      path: `/calendar/event/sms-preview`,
      handle404: true,
      handle500: true,
    })
  }
}
