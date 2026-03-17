import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { AppResponse } from '../models/Locals'
import { SubjectType } from '../middleware/sendAuditMessage'

jest.mock('@ministryofjustice/hmpps-audit-client')

const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')

export const checkAuditMessage = (
  res: AppResponse,
  action: string,
  correlationId: string,
  subjectId?: string,
  subjectType = 'USER',
): void => {
  it('should send an audit message', () => {
    expect(auditSpy).toHaveBeenCalledWith({
      action,
      who: res.locals.user.username,
      subjectId: subjectId || res.locals.user.username,
      subjectType: subjectType || res.locals.user.username,
      correlationId,
      service: 'hmpps-manage-people-on-probation-ui',
    })
  })
}

export const checkSendAuditMessage = (
  res: AppResponse,
  action: string,
  subjectId?: string,
  subjectType?: SubjectType,
): void => {
  expect(auditSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      action,
      who: res.locals.user.username,
      subjectId,
      subjectType,
      correlationId: expect.any(String),
      service: 'hmpps-manage-people-on-probation-ui',
    }),
  )
}
