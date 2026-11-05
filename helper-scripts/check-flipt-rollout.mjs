import 'dotenv/config'

const namespace = process.env.FLIPT_NAMESPACE
const flagKey = process.env.FLIPT_FLAG

const args = process.argv.slice(2)

function getEnvironment() {
  const envIndex = args.indexOf('--env')
  const envArg = args.find(arg => arg.startsWith('--env='))

  if (envIndex !== -1) {
    return args[envIndex + 1]
  }

  if (envArg) {
    return envArg.split('=')[1]
  }

  return 'dev'
}

const selectedEnv = getEnvironment()

const environments = {
  dev: {
    url: process.env.FLIPT_CHECK_URL,
    token: process.env.FLIPT_CHECK_TOKEN,
  },
  preprod: {
    url: process.env.FLIPT_CHECK_URL_PREPROD,
    token: process.env.FLIPT_CHECK_TOKEN_PREPROD,
  },
  prod: {
    url: process.env.FLIPT_CHECK_URL_PROD,
    token: process.env.FLIPT_CHECK_TOKEN_PROD,
  },
}

async function main() {
  const config = environments[selectedEnv]

  if (!config || !config.url || !config.token) {
    throw new Error(`Missing Flipt configuration for ${selectedEnv}`)
  }

  if (!namespace || !flagKey) {
    throw new Error('Missing FLIPT_NAMESPACE or FLIPT_FLAG')
  }

  const endpoint = `${config.url.replace(/\/$/, '')}/api/v1/namespaces/${encodeURIComponent(namespace)}/flags/${encodeURIComponent(flagKey)}/rollouts`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Flipt API error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()

  console.log(`Environment: ${selectedEnv}`)
  console.log(`Namespace: ${namespace}`)
  console.log(`Flag: ${flagKey}`)

  console.log('\nRollout response structure:')
  console.log(JSON.stringify(data, null, 2))

  const rules = data.rules || []

  console.log(`\nRollouts found: ${rules.length}`)

  for (const [index, rule] of rules.entries()) {
    console.log(`\nRollout ${index + 1}`)
    console.log(`Type: ${rule.type || 'Unknown'}`)

    const segment = rule.segment || {}

    console.log('Segment configuration:')
    console.log(JSON.stringify(segment, null, 2))

    const segmentKeys = [
      ...(Array.isArray(segment.segmentKeys) ? segment.segmentKeys : []),
      ...(Array.isArray(segment.keys) ? segment.keys : []),
      ...(segment.segmentKey ? [segment.segmentKey] : []),
      ...(segment.key ? [segment.key] : []),
    ]

    console.log(`Associated segments: ${segmentKeys.length > 0 ? [...new Set(segmentKeys)].join(', ') : 'None found'}`)
  }
}

main().catch(error => {
  console.error('Error retrieving Flipt rollout:', error)
  process.exitCode = 1
})
