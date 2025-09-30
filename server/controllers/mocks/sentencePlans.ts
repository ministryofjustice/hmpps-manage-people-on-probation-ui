import { SentencePlan } from '../../data/model/sentencePlan'

export const mockSentencePlans: SentencePlan[] = [
  {
    publishedState: 'UNPUBLISHED',
    uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    createdDate: '2025-09-29T10:54:36.782Z',
    createdBy: {
      externalId: 'string',
      username: 'string',
    },
    lastUpdatedDate: '2025-09-29T10:54:36.782Z',
    lastUpdatedBy: {
      externalId: 'string',
      username: 'string',
    },
    currentVersion: {
      uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      version: 0,
      planId: 0,
      planType: 'INITIAL',
      status: 'AWAITING_COUNTERSIGN',
      agreementStatus: 'DRAFT',
      createdDate: '2025-09-29T10:54:36.782Z',
      createdBy: {
        externalId: 'string',
        username: 'string',
      },
      updatedDate: '2025-09-29T10:54:36.782Z',
      updatedBy: {
        externalId: 'string',
        username: 'string',
      },
      agreementDate: '2025-09-29T10:54:36.782Z',
      readOnly: true,
      checksum: 'string',
      agreementNotes: [
        {
          optionalNote: 'string',
          agreementStatus: 'DRAFT',
          agreementStatusNote: 'string',
          practitionerName: 'string',
          personName: 'string',
          createdDate: '2025-09-29T10:54:36.782Z',
          createdBy: {
            externalId: 'string',
            username: 'string',
          },
        },
      ],
      planProgressNotes: [
        {
          note: 'string',
          isSupportNeeded: 'YES',
          isSupportNeededNote: 'string',
          isInvolved: true,
          isInvolvedNote: 'string',
          personName: 'string',
          practitionerName: 'string',
          createdDate: '2025-09-29T10:54:36.782Z',
          createdBy: {
            externalId: 'string',
            username: 'string',
          },
        },
      ],
      goals: [
        {
          uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          title: 'string',
          areaOfNeed: {
            uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            name: 'string',
          },
          targetDate: '2025-09-29',
          reminderDate: '2025-09-29',
          createdDate: '2025-09-29T10:54:36.782Z',
          createdBy: {
            externalId: 'string',
            username: 'string',
          },
          updatedDate: '2025-09-29T10:54:36.782Z',
          updatedBy: {
            externalId: 'string',
            username: 'string',
          },
          status: 'ACTIVE',
          statusDate: '2025-09-29T10:54:36.782Z',
          goalOrder: 0,
          steps: [
            {
              uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              description: 'string',
              status: 'NOT_STARTED',
              createdDate: '2025-09-29T10:54:36.782Z',
              createdBy: {
                externalId: 'string',
                username: 'string',
              },
              actor: 'string',
            },
          ],
          notes: [
            {
              note: 'string',
              type: 'PROGRESS',
              createdDate: '2025-09-29T10:54:36.782Z',
              practitionerName: 'string',
            },
          ],
          relatedAreasOfNeed: [
            {
              uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              name: 'string',
            },
          ],
        },
      ],
      softDeleted: true,
      mostRecentUpdateDate: '2025-09-29T10:54:36.782Z',
      mostRecentUpdateByName: 'string',
      crn: 'string',
    },
    crn: 'string',
  },
]
