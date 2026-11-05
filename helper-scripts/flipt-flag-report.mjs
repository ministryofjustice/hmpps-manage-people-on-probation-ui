import 'dotenv/config'

const PAGE_SIZE = 100

const args = process.argv.slice(2)
const envArgs = args.filter(arg => arg.startsWith('--env='))
const selectedEnv = envArgs.length === 1 ? envArgs[0].slice('--env='.length) : 'dev'

const environments = {
  dev: {
    env: process.env.FLIPT_ENV,
    url: process.env.FLIPT_CHECK_URL,
    token: process.env.FLIPT_CHECK_TOKEN,
  },
  preprod: {
    env: process.env.FLIPT_ENV_PREPROD,
    url: process.env.FLIPT_CHECK_URL_PREPROD,
    token: process.env.FLIPT_CHECK_TOKEN_PREPROD,
  },
  prod: {
    env: process.env.FLIPT_ENV_PROD,
    url: process.env.FLIPT_CHECK_URL_PROD,
    token: process.env.FLIPT_CHECK_TOKEN_PROD,
  },
}

const config = environments[selectedEnv]

async function getFliptData(path) {
  const endpoint = `${config.url.replace(/\/$/, '')}${path}`

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

  return response.json()
}

async function getAllPages(path, field) {
  const items = []
  let pageToken = ''
  const seenTokens = new Set()

  do {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    // Pagination is inherently sequential: each page token comes from the previous response
    // eslint-disable-next-line no-await-in-loop
    const data = await getFliptData(`${path}?${params}`)

    if (!Array.isArray(data[field])) {
      throw new Error(`Missing ${field} array in Flipt response`)
    }

    items.push(...data[field])
    pageToken = data.nextPageToken || ''

    if (pageToken) {
      if (seenTokens.has(pageToken)) {
        throw new Error('Repeated Flipt pagination token')
      }
      seenTokens.add(pageToken)
    }
  } while (pageToken)

  return items
}

function getAgeInDays(createdAt) {
  if (!createdAt) return null

  const created = new Date(createdAt).getTime()

  if (Number.isNaN(created)) return null

  return Math.max(0, Math.floor((Date.now() - created) / 86400000))
}

function sortByAge(flags) {
  return flags.sort((a, b) => {
    if (a.ageDays === null && b.ageDays === null) {
      return a.key.localeCompare(b.key)
    }
    if (a.ageDays === null) return 1
    if (b.ageDays === null) return -1

    return b.ageDays - a.ageDays || a.key.localeCompare(b.key)
  })
}

function getSegmentKeys(item) {
  const segment = item.segment || {}

  const keys = [
    ...(Array.isArray(item.segmentKeys) ? item.segmentKeys : []),
    ...(Array.isArray(segment.segmentKeys) ? segment.segmentKeys : []),
  ]

  if (item.segmentKey) keys.push(item.segmentKey)
  if (segment.segmentKey) keys.push(segment.segmentKey)

  return [...new Set(keys)].sort()
}

async function getFlagSegments(namespace, flag) {
  const base = `/api/v1/namespaces/${encodeURIComponent(namespace)}/flags/${encodeURIComponent(flag.key)}`

  const isBoolean = flag.type === 'BOOLEAN_FLAG_TYPE'

  const path = isBoolean ? `${base}/rollouts` : `${base}/rules`

  // Flipt v1 returns "rules" for both endpoints.
  const items = await getAllPages(path, 'rules')

  return [...new Set(items.flatMap(getSegmentKeys))].sort()
}

function buildSummary(report, totalFlags, enabledFlags, disabledFlags, slack) {
  const lines = [
    slack ? `*Flipt Feature Flag Report* - ${config.env}` : `Flipt Feature Flag Report - ${config.env}`,
    '',
    slack ? `*Namespaces:* ${report.length}` : `Namespaces: ${report.length}`,
    slack ? `*Total flags:* ${totalFlags}` : `Total flags: ${totalFlags}`,
    slack ? `:large_green_circle: *Enabled:* ${enabledFlags}` : `Enabled: ${enabledFlags}`,
    slack ? `:red_circle: *Disabled:* ${disabledFlags}` : `Disabled: ${disabledFlags}`,
    '',
    slack ? '*Flags by namespace*' : 'Flags by namespace',
  ]

  for (const item of report) {
    lines.push('')
    lines.push(slack ? `*${item.namespace}*` : item.namespace)

    if (slack) {
      lines.push(`:large_green_circle: ${item.enabled.length} enabled | :red_circle: ${item.disabled.length} disabled`)
    } else {
      lines.push(`  Enabled: ${item.enabled.length} | Disabled: ${item.disabled.length}`)
    }
  }

  return lines.join('\n')
}

function buildFullReport(report, summary) {
  const lines = [summary, '', 'Individual flags (oldest first)']

  for (const item of report) {
    lines.push('')
    lines.push(`Namespace: ${item.namespace}`)

    for (const [status, flags] of [
      ['Enabled', item.enabled],
      ['Disabled', item.disabled],
    ]) {
      lines.push('')
      lines.push(`${status} (${flags.length})`)

      if (flags.length === 0) {
        lines.push('None')
      }

      for (const flag of flags) {
        const age = flag.ageDays === null ? 'Unknown age' : `${flag.ageDays} days old`

        lines.push(`- ${flag.key} — ${age}`)

        if (flag.segments.length > 0) {
          lines.push(`  Segments: ${flag.segments.join(', ')}`)
        }
      }
    }
  }

  return lines.join('\n')
}

async function main() {
  const validArgs = ['--full', '--slack']

  if (
    !config ||
    envArgs.length > 1 ||
    args.some(arg => !validArgs.includes(arg) && !arg.startsWith('--env=')) ||
    (args.includes('--full') && args.includes('--slack'))
  ) {
    throw new Error('Usage: node helper-scripts/flipt-flag-report.mjs [--env=dev|preprod|prod] [--full|--slack]')
  }

  if (!config.env || !config.url || !config.token) {
    throw new Error(`Missing Flipt configuration for ${selectedEnv}`)
  }

  if (config.env !== selectedEnv) {
    throw new Error(`Environment mismatch: selected ${selectedEnv}, configured ${config.env}`)
  }

  const full = args.includes('--full')
  const slack = args.includes('--slack')

  const namespaces = (await getAllPages('/api/v1/namespaces', 'namespaces'))
    .filter(namespace => namespace.key !== 'default')
    .sort((a, b) => a.key.localeCompare(b.key))

  const report = []
  let totalFlags = 0
  let enabledFlags = 0
  let disabledFlags = 0

  const namespaceFlagLists = await Promise.all(
    namespaces.map(async namespace => {
      const flags = await getAllPages(`/api/v1/namespaces/${encodeURIComponent(namespace.key)}/flags`, 'flags')

      return Promise.all(
        flags.map(async flag => ({
          key: flag.key,
          enabled: flag.enabled,
          ageDays: getAgeInDays(flag.createdAt),
          segments: full ? await getFlagSegments(namespace.key, flag) : [],
        })),
      )
    }),
  )

  for (const [index, namespace] of namespaces.entries()) {
    const namespaceFlags = namespaceFlagLists[index]

    const enabled = sortByAge(namespaceFlags.filter(flag => flag.enabled === true))

    const disabled = sortByAge(namespaceFlags.filter(flag => flag.enabled === false))

    if (enabled.length + disabled.length !== namespaceFlags.length) {
      throw new Error(`Unexpected flag status in ${namespace.key}`)
    }

    totalFlags += namespaceFlags.length
    enabledFlags += enabled.length
    disabledFlags += disabled.length

    report.push({
      namespace: namespace.key,
      enabled,
      disabled,
    })
  }

  const summary = buildSummary(report, totalFlags, enabledFlags, disabledFlags, slack)

  if (slack) {
    console.log(JSON.stringify({ text: summary }))
  } else if (full) {
    console.log(buildFullReport(report, summary))
  } else {
    console.log(summary)
  }
}

main().catch(error => {
  console.error('Error generating Flipt report:', error)
  process.exitCode = 1
})
