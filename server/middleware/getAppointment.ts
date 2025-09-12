import { upperFirst } from 'lodash'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { AppointmentLocals } from '../models/Locals'
import { getDataValue, setDataValue } from '../utils'
import { LicenceCondition, Nsi, Requirement, Sentence } from '../data/model/sentenceDetails'
import { Location, Team } from '../data/model/caseload'

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
          sentenceRequirement = sentenceObj?.requirements?.find(
            requirement => requirement.id === parseInt(requirementId, 10),
          )
        }
        if (licenceConditionId) {
          sentenceLicenceCondition = sentenceObj?.licenceConditions?.find(
            lc => lc.id === parseInt(licenceConditionId, 10),
          )
        }
        if (nsiId) {
          sentenceNsi = sentenceObj?.nsis.find(n => n.id === parseInt(nsiId, 10))
        }
      }

      const { providers, teams, users } = (await masClient.getUserProviders(
        res.locals.user.username,
        providerCode,
        teamCode,
      ))
        ? await masClient.getUserProviders(res.locals.user.username, providerCode, teamCode)
        : {}

      const selectedRegion = providerCode && providers ? providers.find(r => r.code === providerCode)?.name : null
      const selectedTeam = teamCode && teams ? teams.find(t => t.code === teamCode)?.description : null
      const selectedUser =
        staffId && users ? users.find(s => s.username.toLowerCase() === staffId.toLowerCase())?.nameAndRole : null

      const hasLocation = locationCode && locationCode !== 'NO_LOCATION_REQUIRED'
      let location: Location | string = locationCode
      if (hasLocation && loggedInUsername) {
        location = req?.session?.data?.locations?.[loggedInUsername]?.find(l => l.code === locationCode) || ''
      }

      appointment = {
        ...appointment,
        meta: {
          ...appointment.meta,
          hasLocation,
        },
        type,
        visorReport: visorReport ? upperFirst(visorReport) : null,
        appointmentFor: {
          sentence: parseInt(eventId, 10) !== 0 ? sentence : null,
          requirement: sentenceRequirement?.description || null,
          licenceCondition: sentenceLicenceCondition?.mainDescription || null,
          nsi: sentenceNsi?.description || null,
          forename: eventId === 'PERSON_LEVEL_CONTACT' ? forename : null,
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
