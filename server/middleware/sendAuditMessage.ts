import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { AppResponse } from '../models/Locals'

export enum SubjectType {
  CRN,
  USER,
}

export default async function sendAuditMessage(
  res: AppResponse,
  action: string,
  subjectId: string,
  subjectType: SubjectType,
) {
  await auditService.sendAuditMessage({
    action,
    who: res.locals.user.username,
    subjectId,
    subjectType,
    correlationId: v4(),
    service: 'hmpps-manage-people-on-probation-ui',
  })
}
