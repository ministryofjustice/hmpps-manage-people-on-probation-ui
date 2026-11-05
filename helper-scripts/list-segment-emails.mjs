import 'dotenv/config'

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
  const namespace = process.env.FLIPT_NAMESPACE
  const segmentKey = process.env.FLIPT_SEGMENT
  const config = environments[selectedEnv]

  try {
    if (!config || !config.url || !config.token) {
      throw new Error(`Missing Flipt configuration for ${selectedEnv}`)
    }

    if (!namespace || !segmentKey) {
      throw new Error('Missing FLIPT_NAMESPACE or FLIPT_SEGMENT')
    }

    const endpoint = `${config.url.replace(/\/$/, '')}/api/v1/namespaces/${encodeURIComponent(namespace)}/segments/${encodeURIComponent(segmentKey)}`

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

    const segment = await response.json()

    const emails = (segment.constraints || [])
      .filter(constraint => constraint.property === 'email')
      .flatMap(constraint =>
        (constraint.value || '')
          .split(',')
          .map(email => email.trim())
          .filter(Boolean),
      )

    console.log(`Environment: ${selectedEnv}`)
    console.log(`Segment: ${segmentKey}`)
    console.log(`Namespace: ${namespace}`)
    console.log(`Total emails: ${emails.length}`)
    console.log('')

    emails.forEach(email => console.log(email))
  } catch (err) {
    console.error('Error retrieving Flipt segment:', err)
    process.exitCode = 1
  }
}

main()
