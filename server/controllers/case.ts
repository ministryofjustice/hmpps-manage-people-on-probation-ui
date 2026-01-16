import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import { toRoshWidget, toPredictors } from '../utils'

const routes = ['getCase'] as const

const caseController: Controller<typeof routes, void> = {
  getCase: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
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

      const { risks, tierCalculation, predictors } = req.session.data.personalDetails[crn]
      const [overview, needs, personRisks, sanIndicatorResponse, contactResponse, practitioner] = await Promise.all([
        masClient.getOverview(crn, sentenceNumber),
        arnsClient.getNeeds(crn),
        masClient.getPersonRiskFlags(crn),
        arnsClient.getSanIndicator(crn),
        masClient.getOverdueOutcomes(crn),
        masClient.getProbationPractitioner(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      const hasDeceased = req.session.data.personalDetails?.[crn]?.overview?.dateOfDeath !== undefined
      const hasPractitioner = practitioner ? !practitioner.unallocated : false
      return res.render('pages/overview', {
        overview,
        needs,
        personRisks,
        risks,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
        personalDetails: req.session.data.personalDetails[crn].overview,
        appointmentsWithoutAnOutcomeCount: contactResponse?.content?.length ?? 0,
        hasDeceased,
        hasPractitioner,
      })
    }
  },
}

export default caseController
