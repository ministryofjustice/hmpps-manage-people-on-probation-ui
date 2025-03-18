import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Request } from 'express'
import { AppResponse } from '../../@types'
import { HmppsAuthClient } from '../../data'
import ArnsApiClient from '../../data/arnsApiClient'
import MasApiClient from '../../data/masApiClient'
import TierApiClient from '../../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../../utils/utils'
import { getQueryString } from './activityLog'

export const activityDetails = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: AppResponse) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

    const arnsClient = new ArnsApiClient(token)
    const masClient = new MasApiClient(token)
    const tierClient = new TierApiClient(token)
    const [personAppointment, tierCalculation, risks, predictors] = await Promise.all([
      masClient.getPersonAppointment(crn, id),
      tierClient.getCalculationDetails(crn),
      arnsClient.getRisks(crn),
      arnsClient.getPredictorsAll(crn),
    ])
    const isActivityLog = true
    const queryParams = getQueryString(req.query as Record<string, string>)
    const { category } = req.query

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const risksWidget = toRoshWidget(risks)
    const predictorScores = toPredictors(predictors)
    return res.render('pages/appointments/appointment', {
      category,
      queryParams,
      personAppointment,
      crn,
      isActivityLog,
      tierCalculation,
      risksWidget,
      predictorScores,
    })
  }
}
