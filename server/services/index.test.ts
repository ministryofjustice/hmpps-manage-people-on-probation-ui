import { getPdu, getManagedBy } from './index'

describe('Probation search component extra columns:Managed by and PDU', () => {
  describe('getPdu', () => {
    it('should return the PDU description in title case if an active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Test Borough')
    })

    it('should return "Unallocated" if no active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: false,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if active manager has no borough description', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {},
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if active manager has no borough description as Unallocated', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: { code: 'N03UAT', description: 'Unallocated Level 2(N03)' },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should handle null/undefined results gracefully', () => {
      expect(getPdu(null)).toBe('Unallocated')
      expect(getPdu({})).toBe('Unallocated')
    })
  })

  describe('getManagedBy', () => {
    it('should return the staff name and borough in title case if an active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              forenames: 'PACOCHA',
              surname: 'LEIGH',
            },
            team: {
              borough: {
                description: 'Unallocated Level 2(N03)',
              },
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Pacocha Leigh')
    })

    it('should return only the staff name if borough description is missing', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              forenames: 'JOHN',
              surname: 'SMITH',
            },
            team: {
              borough: {},
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('John Smith')
    })

    it('should return "Unallocated" if no active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: false,
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if the active manager staff is marked as unallocated', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              unallocated: true,
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Unallocated')
    })

    it('should handle missing staff names gracefully', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('')
    })

    it('should handle null/undefined results gracefully', () => {
      expect(getManagedBy(null)).toBe('Unallocated')
      expect(getManagedBy({})).toBe('Unallocated')
    })
  })
})
