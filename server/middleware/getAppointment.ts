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
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const currentCase = await masClient.getOverview(crn)
    const { forename } = currentCase.personalDetails.name
    const { data } = req.session
    let appointment: AppointmentLocals = {
      meta: {
        isVisor: currentCase.registrations.map(reg => reg.toLowerCase()).includes('visor'),
        forename,
        change: (req?.query?.change as string) || null,
      },
    }
    const appointmentSession: AppointmentSession = getDataValue(data, ['appointments', crn, id]) as Record<
      string,
      string
    >
    if (appointmentSession) {
      const {
        user: { username, locationCode, teamCode },
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
      // console.dir(req.session.data, { depth: null })
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
      const location: Location =
        locationCode && username
          ? req.session.data.locations[username].find(l => l.id === parseInt(locationCode, 10))
          : null
      appointment = {
        ...appointment,
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
          name: '',
          team: '',
          region: '',
        },
        location,
        date,
        start,
        end,
        repeating,
        repeatingDates,
        notes: notes || null,
        sensitivity: sensitivity || 'No',
      }
    }
    res.locals.appointment = appointment
    console.dir(appointment, { depth: null })
    return next()
  }
}
