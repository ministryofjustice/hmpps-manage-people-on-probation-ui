import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import * as Sentry from '@sentry/node'
import { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import { filterContacts, filterContactsMonths } from '../middleware/filterContacts'
import { getCheckinOffenderDetails, getSentences } from '../middleware'
import { getUpcomingCheckinDetails } from '../middleware/getCheckinUpcomingDetails'
import { hasLocationMonitoring } from '../middleware/checkLocationMonitoring'
import { existsInEMDI } from '../middleware/existsInEMDI'
import { PersonExistsResponse } from '../data/emdiClient'
import logger from '../../logger'
import ESupervisionClient from '../data/eSupervisionClient'
import { OffenderEligibility } from '../data/model/esupervision'

const routes = ['getCase'] as const

const caseController: Controller<typeof routes, void> = {
  getCase: hmppsAuthClient => {
    return async function getCase(req, res) {
      const { crn } = req.params as Record<string, string>
      const url = encodeURIComponent(req.url)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const esupClient = new ESupervisionClient(token)
      // Preloads semantic search data into OpenSearch for this CRN; fire-and-forget, non-blocking.
      if (res.locals.flags.enableSemanticSearch) {
        masClient.preloadActivitySearch(crn).catch(err => {
          const eventId = Sentry.captureException(err, {
            tags: {
              service: 'Manage a Supervision API',
              operation: 'preloadActivitySearch',
            },
            extra: { crn },
          })
          logger.error(err, `Failed to preload activity search data for crn: ${crn}. Sentry eventId: ${eventId}`)
        })
      }
      const sentenceNumber = (req?.query?.sentenceNumber ?? '') as string
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_OVERVIEW',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      // Failure isolation (MAN-2840): when ARNS is unavailable the person-header shows an error and
      // the overview should still load, so don't let these ARNS calls fail the whole page.
      const isolateApiFailures = res.locals.flags?.enablePersonHeader
      const needsPromise = arnsClient.getNeeds(crn)
      const sanIndicatorPromise = arnsClient.getSanIndicator(crn)
      const [overview, needs, sanIndicatorResponse, contactResponse, practitioner] = await Promise.all([
        masClient.getOverview(crn, sentenceNumber),
        isolateApiFailures ? needsPromise.catch((): null => null) : needsPromise,
        isolateApiFailures ? sanIndicatorPromise.catch((): null => null) : sanIndicatorPromise,
        masClient.getOverdueOutcomes(crn),
        masClient.getProbationPractitioner(crn),
      ])
      const outcomes = res.locals.flags.enable3MonthsOutcomes
        ? filterContactsMonths(contactResponse?.content)
        : filterContacts(contactResponse?.content)

      let checkinEligibility: OffenderEligibility | undefined
      if (res.locals.flags.enableEsupEligibilityCheck) {
        checkinEligibility = await esupClient.getOffenderEligibility(crn)
      }
      // Personal details aren't cached in the session when the header had an API failure, so fall
      // back to the copy getPersonalDetails always puts on res.locals.
      const personalDetails = req.session.data.personalDetails?.[crn]?.overview ?? res.locals.case
      const hasDeceased = personalDetails?.dateOfDeath !== undefined
      const hasPractitioner = practitioner ? !practitioner.unallocated : false
      const canAccessCheckins = hasPractitioner && res.locals.flags?.enableESupervisionCheckins === true
      await getCheckinOffenderDetails(hmppsAuthClient)(req, res)
      await getUpcomingCheckinDetails(hmppsAuthClient)(req, res)
      let personExistsResponse: PersonExistsResponse | undefined
      await getSentences(hmppsAuthClient)(req, res, () => {})
      const hasLocationMonitoringData = (res.locals?.sentences || []).some(item =>
        hasLocationMonitoring(item?.licenceConditions, item?.requirements),
      )
      if (hasLocationMonitoringData) {
        personExistsResponse = await existsInEMDI(crn, token)
        res.locals.personExistsResponse = personExistsResponse
      }
      return res.render('pages/overview', {
        overview,
        needs,
        crn,
        url,
        sanIndicator: sanIndicatorResponse?.sanIndicator,
        personalDetails,
        appointmentsWithoutAnOutcomeCount: outcomes?.length ?? 0,
        hasDeceased,
        hasPractitioner,
        canAccessCheckins,
        locationMonitoringUri: personExistsResponse?.uri,
        checkinEligibility,
      })
    }
  },
}

export default caseController
