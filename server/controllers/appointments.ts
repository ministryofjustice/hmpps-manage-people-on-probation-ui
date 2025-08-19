import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Request } from 'express'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { fullName, toRoshWidget, toPredictors, isNumericString, isValidCrn, setDataValue, getDataValue, isMatchingAddress } from '../utils'
import logger from '../../logger'
import { ErrorMessages } from '../data/model/caseload'
import { renderError, getAppointment } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentSession } from '../models/Appointments'

const routes = [
  'getAppointments',
  'getAllUpcomingAppointments',
  'postAppointments',
  'getAppointmentDetails',
  'getRecordAnOutcome',
  'postRecordAnOutcome',
  'getNextAppointment',
  'getManageAppointment',
  'getNextAppointment',
] as const

const appointmentsController: Controller<typeof routes, void> = {
  getAppointments: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_APPOINTMENTS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const [upcomingAppointments, pastAppointments, risks, tierCalculation, predictors, personRisks] =
        await Promise.all([
          masClient.getPersonSchedule(crn, 'upcoming', '0'),
          masClient.getPersonSchedule(crn, 'previous', '0'),
          arnsClient.getRisks(crn),
          tierClient.getCalculationDetails(crn),
          arnsClient.getPredictorsAll(crn),
          masClient.getPersonRiskFlags(crn),
        ])

      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)

      return res.render('pages/appointments', {
        upcomingAppointments,
        pastAppointments,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        personRisks,
      })
    }
  },
  getAllUpcomingAppointments: hmppsAuthClient => {
    return async (req, res) => {
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date.asc'
      const [sortName, sortDirection] = sortedBy.split('.')
      const isAscending: boolean = sortDirection === 'asc'
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const sortQuery =
        sortName === 'time' ? `&sortBy=date&ascending=${isAscending}` : `&sortBy=${sortName}&ascending=${isAscending}`
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ALL_UPCOMING_APPOINTMENTS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const [upcomingAppointments, risks, tierCalculation, predictors] = await Promise.all([
        masClient.getPersonSchedule(crn, 'upcoming', (pageNum - 1).toString(), sortQuery),
        arnsClient.getRisks(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        upcomingAppointments.personSchedule?.totalPages || 0,
        upcomingAppointments.personSchedule?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        upcomingAppointments.personSchedule?.size || 10,
      )

      return res.render('pages/upcoming-appointments', {
        upcomingAppointments,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        sortedBy,
        pagination,
      })
    }
  },
  postAppointments: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      return res.redirect(`/case/${crn}/arrange-appointment/type`)
    }
  },
  getAppointmentDetails: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { contactId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_DETAILS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personAppointment = await masClient.getPersonAppointment(crn, contactId)
      res.render('pages/appointments/appointment', {
        personAppointment,
        crn,
      })
    }
  },
  getManageAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      await auditService.sendAuditMessage({
        action: 'VIEW_MANAGE_APPOINTMENT',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { username } = res.locals.user
      const [personAppointment, nextComAppointment, appointmentTypes] = await Promise.all([
        masClient.getPersonAppointment(crn, contactId),
        masClient.getNextComAppointment(username, crn, contactId),
        masClient.getAppointmentTypes(),
      ])
      const { appointment } = personAppointment
      const deliusManaged =
        (appointment?.hasOutcome && appointment?.acceptableAbsence === false) ||
        appointmentTypes.appointmentTypes.every(type => type.description !== appointment.type)
      const nextAppointmentIsAtHome = isMatchingAddress(
        res.locals.case.mainAddress,
        nextComAppointment?.appointment?.location,
      )
      return res.render('pages/appointments/manage-appointment', {
        personAppointment,
        crn,
        nextComAppointment,
        deliusManaged,
        nextAppointmentIsAtHome,
      })
    }
  },
  getRecordAnOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, actionType } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_DETAILS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const schedule = await masClient.getPersonSchedule(crn, 'previous', '0')
      res.render('pages/appointments/record-an-outcome', {
        schedule,
        crn,
        actionType,
      })
    }
  },
  postRecordAnOutcome: hmppsAuthClient => {
    return async (req: Request, res: AppResponse) => {
      const { crn, actionType } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const errorMessages: ErrorMessages = {}
      const appointmentId = req?.body?.['appointment-id'] as string
      if (appointmentId == null) {
        logger.info('Appointment not selected')
        errorMessages.appointment = { text: 'Please select an appointment' }
        const schedule = await masClient.getPersonSchedule(crn, 'previous', '0')
        res.render('pages/appointments/record-an-outcome', {
          errorMessages,
          schedule,
          crn,
          actionType,
        })
      } else {
        // eslint-disable-next-line no-lonely-if
        if (!isValidCrn(crn) || !isNumericString(appointmentId)) {
          renderError(404)(req, res)
        } else {
          res.redirect(`/case/${crn}/appointments/appointment/${req.body['appointment-id']}`)
        }
      }
    }
  },
  getNextAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      const { data } = req.session
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_DETAILS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personAppointment = await masClient.getPersonAppointment(crn, contactId)
      console.log(data)
      // const locations = await masClient.getOfficeLocationsByTeamAndProvider(providerCode, teamCode) //might need to get location codes
      console.log(personAppointment)
      const Appt: AppointmentSession = {
        user: {
          providerCode: '',
          teamCode: '',
          username: '',
          locationCode: personAppointment.appointment.location ? 'MAP' : '', // how to map from Address object to location code
        },
        type: personAppointment.appointment.type,
        visorReport: res.locals.appointment.meta.isVisor ? 'Yes' : 'No', // how to get
        date: '',
        start: '',
        end: '',
        until: '',
        repeatingDates: [] as string[],
        numberOfAppointments: '1',
        numberOfRepeatAppointments: '0',
        repeating: 'No',
        eventId: personAppointment.appointment.eventNumber ? personAppointment.appointment.eventNumber : '',
        username: fullName(personAppointment.appointment.officerName),
        uuid: contactId,
        requirementId: '', // how to get
        licenceConditionId: '', // how to get
        nsiId: '', // how to get
        notes: personAppointment.appointment.appointmentNotes[0].note, // notes, appointmentNotes or appointmentNote? - need schema access
        sensitivity: personAppointment.appointment.isSensitive ? 'Yes' : 'No',
      }
      // what will always exist. What may not?
      setDataValue(data, ['appointments', crn, contactId], Appt)
      setDataValue(data, ['return-dest'], { crn, contactID: contactId })
      console.log(getDataValue(data, ['appointments', crn, contactId]))
      res.render('pages/appointments/next-appointment', {
        personAppointment,
        crn,
      })
    }
  },
}

export default appointmentsController

//   id?: string
//   type?: string
//   startDateTime?: string
//   endDateTime?: string
//   rarToolKit?: string
//   appointmentNotes?: Note[]
//   appointmentNote?: Note
//   isSensitive?: boolean
//   hasOutcome?: boolean
//   wasAbsent?: boolean
//   officerName?: Name
//   isInitial?: boolean
//   isNationalStandard?: boolean
//   rescheduled?: boolean
//   rescheduledStaff?: boolean
//   rescheduledPop?: boolean
//   didTheyComply?: boolean
//   absentWaitingEvidence?: boolean
//   rearrangeOrCancelReason?: string
//   rescheduledBy?: Name
//   repeating?: boolean
//   nonComplianceReason?: string
//   documents?: Document[]
//   rarCategory?: string
//   acceptableAbsence?: boolean
//   acceptableAbsenceReason?: string
//   location?: Address
//   action?: string
//   isSystemContact?: boolean
//   isAppointment?: boolean
//   isCommunication?: boolean
//   isEmailOrTextFromPop?: boolean
//   isPhoneCallFromPop?: boolean
//   isEmailOrTextToPop?: boolean
//   isPhoneCallToPop?: boolean
//   lastUpdated?: string
//   lastUpdatedBy?: Name
//   deliusManaged?: boolean

// From getAppointment
// const location: Location | string =
//   locationCode && locationCode !== noLocationValue && loggedInUsername
//     ? req?.session?.data?.locations?.[loggedInUsername]?.find(l => l.code === locationCode)
//     : 'Not needed'
