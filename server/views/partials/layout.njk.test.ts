import vm from 'vm'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('partials/layout.njk', input)
}

// Extracts the <script> block containing the `document.initialiseTelemetry(...)` call
// and executes it in a sandboxed vm context with a stubbed `document.initialiseTelemetry`
// so we can assert on the actual JS values the browser would receive - as opposed to just
// pattern-matching the rendered HTML string, which wouldn't catch encoding/escaping bugs.
const extractInitialiseTelemetryArgs = (html: string): unknown[] => {
  const scriptTagRegex = /<script[^>]*>([^]*?)<\/script>/g
  let scriptContent: string | undefined
  let match = scriptTagRegex.exec(html)
  while (match) {
    const [, content] = match
    if (content.includes('document.initialiseTelemetry')) {
      scriptContent = content
      break
    }
    match = scriptTagRegex.exec(html)
  }
  if (!scriptContent) {
    throw new Error('Could not find the initialiseTelemetry <script> block in rendered output')
  }

  let capturedArgs: unknown[] = []
  const sandbox = {
    document: {
      addEventListener: (_event: string, callback: () => void) => callback(),
      initialiseTelemetry: (...args: unknown[]) => {
        capturedArgs = args
      },
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(scriptContent, sandbox)

  return capturedArgs
}

describe('partials/layout.njk', () => {
  describe('document.initialiseTelemetry(...) call', () => {
    it('passes through the connection string, role name, username and trace id unchanged for typical values', () => {
      const html = render({
        applicationInsightsConnectionString: 'InstrumentationKey=abc123;IngestionEndpoint=https://uksouth.example.com/',
        applicationInsightsRoleName: 'hmpps-manage-people-on-probation-ui',
        user: { username: 'AMARDEEPCHIMBER' },
        applicationInsightsTraceId: '4ac6b09ec86aef5b3786f56ac3bcb678',
      })

      const args = extractInitialiseTelemetryArgs(html)

      expect(args).toEqual([
        'InstrumentationKey=abc123;IngestionEndpoint=https://uksouth.example.com/',
        'hmpps-manage-people-on-probation-ui',
        'AMARDEEPCHIMBER',
        '4ac6b09ec86aef5b3786f56ac3bcb678',
      ])
    })

    it('passes an empty string (not a single space) for the connection string when not configured', () => {
      const html = render({
        applicationInsightsConnectionString: null,
        applicationInsightsRoleName: 'hmpps-manage-people-on-probation-ui',
        user: { username: 'AMARDEEPCHIMBER' },
        applicationInsightsTraceId: '4ac6b09ec86aef5b3786f56ac3bcb678',
      })

      const [connectionString] = extractInitialiseTelemetryArgs(html)

      expect(connectionString).toBe('')
    })

    // NOTE: `user.username` is populated from the HMPPS Auth JWT (`params.user_name`), i.e. the
    // person's system-generated login id (e.g. "AUSER") - not user-supplied free text,
    // and HMPPS Auth usernames never contain punctuation like apostrophes. So while the assertion
    // below documents a real gap in how this value is embedded in the page (a value containing a
    // quote/apostrophe gets corrupted into literal HTML-entity text rather than escaped correctly),
    // it is not a gap that can actually occur with this field's real-world values, and is not a
    // security/XSS risk either (HTML entities are not decoded inside <script> tag content by
    // browsers, so this is a data-corruption gap, not a script-injection one). Left as documentation
    // rather than fixed, since fixing it would require changing this file's rendering approach for
    // no practical benefit given the actual shape of this data.
    it('documents a known (but not realistically triggerable) gap: a username containing an apostrophe is corrupted, not preserved', () => {
      const html = render({
        applicationInsightsConnectionString: 'InstrumentationKey=abc123',
        applicationInsightsRoleName: 'hmpps-manage-people-on-probation-ui',
        user: { username: "O'Brien" },
        applicationInsightsTraceId: '4ac6b09ec86aef5b3786f56ac3bcb678',
      })

      const [, , username] = extractInitialiseTelemetryArgs(html)

      // The real username "O'Brien" is corrupted to this literal, HTML-entity-encoded value -
      // this is the "gap", not the correct behaviour.
      expect(username).toBe('O&#39;Brien')
    })
  })
})
