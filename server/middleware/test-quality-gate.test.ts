import { testQualityGate, testQualityGatePassword } from './test-quality-gate'

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

  describe('testQualityGatePassword', () => {
    it('returns the expected password', () => {
      expect(testQualityGatePassword()).toBe('TestPassword123!')
    })
  })
})
