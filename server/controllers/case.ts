import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import { getCheckinOffenderDetails } from '../middleware/getCheckinOffenderDetails'

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
      const last2Years = contactResponse?.content?.filter(contact => {
        const contactDate = DateTime.fromISO(contact.date)
        const twoYearsAgo = DateTime.now().minus({ years: 2 })
        return contactDate >= twoYearsAgo
      })
      const hasDeceased = req.session.data.personalDetails?.[crn]?.overview?.dateOfDeath !== undefined
      const hasPractitioner = practitioner ? !practitioner.unallocated : false
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      return res.render('pages/overview', {
        overview,
        needs,
        crn,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
        personalDetails: req.session.data.personalDetails[crn].overview,
        appointmentsWithoutAnOutcomeCount: last2Years?.length ?? 0,
        hasDeceased,
        hasPractitioner,
      })
    }
  },
}

export default caseController
