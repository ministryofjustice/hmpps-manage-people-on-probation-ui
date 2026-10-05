import crypto from 'crypto'
import { testQualityGate, testQualityGateCrypto, testQualityGatePassword } from './test-quality-gate'

describe('quality gate tests', () => {
  describe('testQualityGate', () => {
    it('fetches the expected URL', async () => {
      const mockResponse = { ok: true }

      global.fetch = jest.fn().mockResolvedValue(mockResponse)

      const result = await testQualityGate()

      expect(fetch).toHaveBeenCalledWith('http://example.com/api')
      expect(result).toBe(mockResponse)
    })
  })

  describe('testQualityGateCrypto', () => {
    it('returns the MD5 hash of the test value', () => {
      const result = testQualityGateCrypto()

      const expected = crypto.createHash('md5').update('test-value').digest('hex')

      expect(result).toBe(expected)
    })
  })

  describe('testQualityGatePassword', () => {
    it('returns the expected password', () => {
      expect(testQualityGatePassword()).toBe('TestPassword123!')
    })
  })
})
