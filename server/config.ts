const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

export interface SentryConfig {
  dsn: string
  loaderScriptId: string
  tracesSampleRate: number
  replaySampleRate: number
  replayOnErrorSampleRate: number
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  applicationName: 'Manage people on probation',
  env: get('ENVIRONMENT', 'local', requiredInProduction) as 'local' | 'dev' | 'preprod' | 'prod',
  staticResourceCacheDuration: '1h',
  redis: {
    enabled: get('REDIS_ENABLED', 'false', requiredInProduction) === 'true',
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    loaderScriptId: process.env.SENTRY_LOADER_SCRIPT_ID,
    tracesSampleRate: Number(get('SENTRY_TRACES_SAMPLE_RATE', 0.05)),
    replaySampleRate: Number(get('SENTRY_REPLAY_SAMPLE_RATE', 0.0)),
    replayOnErrorSampleRate: Number(get('SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE', 0.1)),
  },
  delius: {
    link: get('DELIUS_LINK', 'https://ndelius-dummy-url', requiredInProduction),
  },
  oaSys: {
    link: get('OASYS_LINK', 'https://oasys-dummy-url', requiredInProduction),
  },
  tier: {
    link: get('TIER_LINK', 'https://tier-dummy-url', requiredInProduction),
  },
  sentencePlan: {
    link: get('SENTENCE_PLAN_LINK', 'https://sentence-plan-dummy-url', requiredInProduction),
  },
  interventions: {
    link: get('INTERVENTIONS_LINK', 'https://interventions-dummy-url', requiredInProduction),
  },
  recall: {
    link: get('RECALL_LINK', 'https://consider-a-recall-dev.hmpps.service.justice.gov.uk/', requiredInProduction),
  },
  cas1: {
    link: get('CAS1_LINK', 'https://approved-premises.hmpps.service.justice.gov.uk/', requiredInProduction),
  },
  cas3: {
    link: get(
      'CAS3_LINK',
      'https://transitional-accommodation-dev.hmpps.service.justice.gov.uk/referrals',
      requiredInProduction,
    ),
  },
  caval: {
    link: get('CAVAL_LINK', 'https://create-and-vary-a-licence-dev.hmpps.service.justice.gov.uk', requiredInProduction),
  },
  epf2: {
    link: get('EPF2_LINK', 'https://epf.linkspace.uk', requiredInProduction),
  },
  flipt: {
    url: get('FLIPT_URL', 'http://localhost:8100', requiredInProduction),
    token: get('FLIPT_TOKEN', 'FLIPT_TOKEN', requiredInProduction),
  },
  apis: {
    appInsights: {
      connectionString: get('APPLICATIONINSIGHTS_CONNECTION_STRING', null, requiredInProduction),
    },
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    masApi: {
      url: get('MAS_API_URL', 'http://localhost:8100', requiredInProduction),
      pageSize: 10,
      timeout: {
        response: Number(get('MAS_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('MAS_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('MAS_API_TIMEOUT_RESPONSE', 5000))),
    },
    arnsApi: {
      url: get('ARNS_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('ARNS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('ARNS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('ARNS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tierApi: {
      url: get('TIER_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TIER_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('TIER_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('TIER_API_TIMEOUT_RESPONSE', 10000))),
    },
    interventionsApi: {
      url: get('INTERVENTIONS_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('INTERVENTIONS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('INTERVENTIONS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('INTERVENTIONS_API_TIMEOUT_RESPONSE', 10000))),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  environmentName: get('ENVIRONMENT_NAME', ''),
  dateFields: ['date'],
}
