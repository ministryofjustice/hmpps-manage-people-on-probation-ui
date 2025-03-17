import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'

export const staffContacts = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: Response) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_SENTENCE_PROFESSIONAL_CONTACTS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const masClient = new MasApiClient(token)

    const professionalContact = await masClient.getContacts(crn)

    const { previousContacts } = professionalContact

    const { currentContacts } = professionalContact

    const isSentenceJourney = req.url.split('/').includes('sentence')

    res.render('pages/staff-contacts', {
      professionalContact,
      previousContacts,
      currentContacts,
      isSentenceJourney,
      crn,
    })
  }
}
