import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import { filterContacts } from '../middleware/filterContacts'
import { getCheckinOffenderDetails, getSentences } from '../middleware'
import { getUpcomingCheckinDetails } from '../middleware/getCheckinUpcomingDetails'
import { hasLocationMonitoring } from '../middleware/checkLocationMonitoring'
import { existsInEMDI } from '../middleware/existsInEMDI'
import { Sentences } from '../data/model/sentenceDetails'

const routes = ['getCase'] as const

const caseController: Controller<typeof routes, void> = {
  getCase: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const sentenceNumber = (req?.query?.sentenceNumber ?? '') as string
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_OVERVIEW',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const [overview, needs, sanIndicatorResponse, contactResponse, practitioner] = await Promise.all([
        masClient.getOverview(crn, sentenceNumber),
        arnsClient.getNeeds(crn),
        arnsClient.getSanIndicator(crn),
        masClient.getOverdueOutcomes(crn),
        masClient.getProbationPractitioner(crn),
      ])
      let outcomes = contactResponse?.content
      if (res.locals.flags.enableOutcomesV1) {
        outcomes = filterContacts(outcomes)
      }
      const hasDeceased = req.session.data.personalDetails?.[crn]?.overview?.dateOfDeath !== undefined
      const hasPractitioner = practitioner ? !practitioner.unallocated : false
      const canAccessCheckins = hasPractitioner && res.locals.flags?.enableESupervisionCheckins === true
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      await getUpcomingCheckinDetails(hmppsAuthClient)(req, res)
      if (res.locals.flags.enableEMDIOverviewShowGPSData) {
        const response: Sentences = await masClient.getSentences(crn)
        res.locals.sentences = response.sentences
        const hasLocationMonitoringData = (res.locals?.sentences || []).some(item =>
          hasLocationMonitoring(item?.licenceConditions, item?.requirements),
        )
        if (hasLocationMonitoringData) {
          res.locals.locationMonitoringUri = await existsInEMDI(crn, token)
        }
      }
      return res.render('pages/overview', {
        overview,
        needs,
        crn,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
        personalDetails: req.session.data.personalDetails[crn].overview,
        appointmentsWithoutAnOutcomeCount: outcomes?.length ?? 0,
        hasDeceased,
        hasPractitioner,
        canAccessCheckins,
      })
    }
  },
}

export default caseController
