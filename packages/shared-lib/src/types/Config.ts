type Env = 'local' | 'dev' | 'preprod' | 'prod'

interface LinkConfig {
  link: string
}

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  externalUrl?: string
  timeout: {
    response: number
    deadline: number
  }
  agent?: AgentConfig
  apiClientId?: string
  apiClientSecret?: string
  systemClientId?: string
  systemClientSecret?: string
  pageSize?: number
}

export interface SentryConfig {
  dsn: string
  loaderScriptId: string
  tracesSampleRate: number
  replaySampleRate: number
  replayOnErrorSampleRate: number
}

interface RedisConfig {
  enabled: boolean
  host: string
  port: number
  password: string
  tls_enabled: string
}

export interface Config {
  buildNumber: string
  productId: string
  gitRef: string
  branchName: string
  production: boolean
  https: boolean
  applicationName: string
  env: Env
  staticResourceCacheDuration: '1h'
  redis: RedisConfig
  session: {
    secret: string
    expiryMinutes: number
  }
  sentry: SentryConfig
  delius: LinkConfig
  oaSys: LinkConfig
  tier: LinkConfig
  sentencePlan: LinkConfig
  interventions: LinkConfig
  recall: LinkConfig
  cas1: LinkConfig
  cas3: LinkConfig
  caval: LinkConfig
  guidance: LinkConfig
  epf2: LinkConfig
  flipt: LinkConfig
  probationFrontendComponents: {
    connectSrc: string
    fontSrc: string
  }
  apis: {
    appInsights: ApiConfig
    hmppsAuth: ApiConfig
    manageUsersApi: ApiConfig
    tokenVerification: ApiConfig
    masApi: ApiConfig
    arnsApi: ApiConfig
    tierApi: ApiConfig
    interventionsApi: ApiConfig
    masAppointmentsApi: ApiConfig
    sentencePlanApi: ApiConfig
    probationFrontendComponentsApi: ApiConfig
    eSupervisionApi: ApiConfig
  }
  domain: string
  environmentName: string
  dateFields: string[]
  timeFields: { name: string; dateField: string }[]
  validMimeTypes: Record<string, string>
  maxFileSize: number
  fileUploadLimit: number
  maxCharCount: number
  preservedWords: string[]
  preservedSeparators: string[]
}
