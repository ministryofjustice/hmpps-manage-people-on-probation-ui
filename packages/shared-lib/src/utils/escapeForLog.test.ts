import { escapeForLog } from './escapeForLog'

describe('utils/escapeForLog', () => {
  it('returns empty string for null', () => {
    expect(escapeForLog(null)).toBe('')
  })
  it('returns empty string for undefined', () => {
    expect(escapeForLog(undefined)).toBe('')
  })
  it('converts number to string', () => {
    expect(escapeForLog(123)).toBe('123')
  })
  it('removes \\n and \\r characters', () => {
    expect(escapeForLog('hello\r\nworld')).toBe('hello world')
  })
  it('removes Unicode line separators', () => {
    expect(escapeForLog('hello\u2028world\u2029')).toBe('hello world')
  })
  it('returns normal string unchanged (except control chars)', () => {
    expect(escapeForLog('safe-string')).toBe('safe-string')
  })
  it('handles objects by stringifying them', () => {
    expect(escapeForLog({ a: 1 })).toBe('[object Object]')
  })
})
