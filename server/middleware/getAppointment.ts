import { upperFirst } from 'lodash'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { AppointmentLocals } from '../models/Locals'
import { getDataValue } from '../utils'
import { LicenceCondition, Nsi, Requirement, Sentence } from '../data/model/sentenceDetails'

export const getAppointment = (hmppsAuthClient: HmppsAuthClient): Route<void> => {
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
        type: typeId,
        visorReport,
        sentence: sentenceId,
        'sentence-requirement': sentenceRequirementId,
        'sentence-licence-condition': sentenceLicenceConditionId,
        'sentence-nsi': sentenceNsiId,
      } = appointmentSession
      const type: AppointmentType | null = typeId
        ? req.session.data.appointmentTypes.find(t => t.code === typeId)
        : null
      let sentenceObj: Sentence
      let sentence: string
      let sentenceRequirement: Requirement
      let sentenceLicenceCondition: LicenceCondition
      let sentenceNsi: Nsi
      if (sentenceId) {
        sentenceObj = req.session.data.sentences[crn].find(s => s.id === parseInt(sentenceId, 10))
        sentence = parseInt(sentenceId, 10) !== 1 ? sentenceObj.order.description : forename
        if (sentenceRequirementId) {
          sentenceRequirement = sentenceObj.requirements.find(
            requirement => requirement.id === parseInt(sentenceRequirementId, 10),
          )
        }
        if (sentenceLicenceConditionId) {
          sentenceLicenceCondition = sentenceObj.licenceConditions.find(
            lc => lc.id === parseInt(sentenceLicenceConditionId, 10),
          )
        }
        if (sentenceNsiId) {
          sentenceNsi = sentenceObj.nsis.find(n => n.id === parseInt(sentenceNsiId, 10))
        }
      }
      appointment = {
        ...appointment,
        type,
        visorReport: visorReport ? upperFirst(visorReport) : null,
        appointmentFor: {
          sentence: sentence || null,
          requirement: sentenceRequirement?.description || null,
          licenceCondition: sentenceLicenceCondition?.mainDescription || null,
          nsi: sentenceNsi?.description || null,
        },
        attending: {
          name: '',
          team: '',
          region: '',
        },
        location: {
          buildingName: '',
          buildingNumber: '',
          streetName: '',
          district: '',
          town: '',
          county: '',
          postcode: '',
        },
        dateTime: [],
        repeating: 'Yes',
        notes: '',
        sensitivity: 'No',
      }
    }
    res.locals.appointment = appointment
    return next()
  }
}
