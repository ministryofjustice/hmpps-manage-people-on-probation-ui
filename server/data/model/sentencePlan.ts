interface SentencePlan {
  publishedState: string
  uuid: string
  createdDate: string
  createdBy?: {
    externalId: string
    username: string
  }
  lastUpdatedDate: string
  lastUpdatedBy?: {
    externalId: string
    username: string
  }
  currentVersion?: CurrentVersion
  crn?: string
}

interface CurrentVersion {
  uuid: string
  version: number
  planId: number
  planType: string
  status: string
  agreementStatus: string
  createdDate: string
  createdBy: {
    externalId: string
    username: string
  }
  updatedDate: string
  updatedBy: {
    externalId: string
    username: string
  }
  agreementDate: string
  readonly: boolean
  checksum: string
}
