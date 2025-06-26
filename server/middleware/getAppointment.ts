import { upperFirst } from 'lodash'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { AppointmentLocals } from '../models/Locals'
import { getDataValue } from '../utils'
import { LicenceCondition, Nsi, Requirement, Sentence } from '../data/model/sentenceDetails'
import { Location } from '../data/model/caseload'

export const getAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = req.params
    const { username: loggedInUsername = '' } = res.locals.user
    const token = await hmppsAuthClient.getSystemClientToken(loggedInUsername)
    const masClient = new MasApiClient(token)
    const currentCase = await masClient.getOverview(crn)
    const { forename } = currentCase.personalDetails.name
    const { data } = req.session
    let userIsAttending = null
    if (req?.session?.data?.appointments?.[crn]?.[id]?.user?.username && loggedInUsername) {
      userIsAttending = req.session.data.appointments[crn][id].user.username === loggedInUsername
    }
    let appointment: AppointmentLocals = {
      meta: {
        isVisor: currentCase.registrations.map(reg => reg.toLowerCase()).includes('visor'),
        forename,
        change: (req?.query?.change as string) || null,
        userIsAttending,
      },
    }
    const appointmentSession: AppointmentSession = getDataValue(data, ['appointments', crn, id]) as Record<
      string,
      string
    >
    if (appointmentSession) {
      const {
        user: { username: staffId = null, locationCode = null, providerCode = null, teamCode = null } = {},
        type: typeId,
        visorReport,
        eventId,
        requirementId,
        licenceConditionId,
        nsiId,
        date,
        start,
        end,
        repeatingDates,
        repeating,
        notes,
        sensitivity,
      } = appointmentSession
      const type: AppointmentType | null = typeId
        ? req.session.data.appointmentTypes.find(t => t.code === typeId)
        : null
      let sentenceObj: Sentence
      let sentence: string
      let sentenceRequirement: Requirement
      let sentenceLicenceCondition: LicenceCondition
      let sentenceNsi: Nsi

      if (parseInt(eventId, 10) !== 1 && req?.session?.data?.sentences?.[crn]) {
        sentenceObj = req.session.data.sentences[crn].find(s => s.id === parseInt(eventId, 10))
        sentence = parseInt(eventId, 10) !== 1 ? sentenceObj?.order?.description : forename
        if (requirementId) {
          sentenceRequirement = sentenceObj.requirements.find(
            requirement => requirement.id === parseInt(requirementId, 10),
          )
        }
        if (licenceConditionId) {
          sentenceLicenceCondition = sentenceObj.licenceConditions.find(
            lc => lc.id === parseInt(licenceConditionId, 10),
          )
        }
        if (nsiId) {
          sentenceNsi = sentenceObj.nsis.find(n => n.id === parseInt(nsiId, 10))
        }
      }
      const selectedRegion =
        providerCode && req?.session?.data?.providers?.[loggedInUsername]
          ? req.session.data.providers[loggedInUsername].find(r => r.code === providerCode)?.name
          : null
      const selectedTeam =
        teamCode && req?.session?.data.teams?.[loggedInUsername]
          ? req.session.data.teams[loggedInUsername].find(t => t.code === teamCode)?.description
          : null
      const selectedUser =
        staffId && req?.session?.data?.staff?.[loggedInUsername]
          ? req.session.data.staff[loggedInUsername].find(s => s.username === staffId)?.nameAndRole
          : null
      const noLocationValue = 'I do not need to pick a location'
      const location: Location | string =
        locationCode && locationCode !== noLocationValue && loggedInUsername
          ? req?.session?.data?.locations?.[loggedInUsername]?.find(l => l.id === parseInt(locationCode, 10))
          : 'Not needed'
      appointment = {
        ...appointment,
        meta: {
          ...appointment.meta,
          hasLocation: locationCode !== noLocationValue,
        },
        type,
        visorReport: visorReport ? upperFirst(visorReport) : null,
        appointmentFor: {
          sentence: parseInt(eventId, 10) !== 0 ? sentence : null,
          requirement: sentenceRequirement?.description || null,
          licenceCondition: sentenceLicenceCondition?.mainDescription || null,
          nsi: sentenceNsi?.description || null,
          forename: parseInt(eventId, 10) === 1 ? forename : null,
        },
        attending: {
          name: selectedUser,
          team: selectedTeam,
          region: selectedRegion,
        },
        location,
        date,
        start,
        end,
        repeating,
        repeatingDates,
        notes: notes || 'None',
        sensitivity: sensitivity || 'No',
      }
    }
    res.locals.appointment = appointment
    return next()
  }
}
