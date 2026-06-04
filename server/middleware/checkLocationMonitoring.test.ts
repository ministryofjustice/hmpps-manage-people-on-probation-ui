import {
  checkLocationMonitoring,
  checkLocationMonitoringByEventNumber,
  hasLocationMonitoring,
  checkLocationMonitoringCode,
} from './checkLocationMonitoring'
import { LicenceCondition, Requirement, Sentence } from '../data/model/sentenceDetails'

describe('checkLocationMonitoring', () => {
  it('should return true for hasLicenceConditionsLMData when a licence condition has valid LM code', () => {
    const licenceConditions = [
      { id: 1, mainDescription: 'This is a Location Monitoring condition', code: 'EM01' },
    ] as LicenceCondition[]
    const requirements = [] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should return true for hasRequirementsLMData when a requirement has valid LM code', () => {
    const licenceConditions = [] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Requirement with Location Monitoring', code: 'RM59' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(true)
  })

  it('should return true for both when both contain valid LM codes', () => {
    const licenceConditions = [{ id: 1, mainDescription: 'Location Monitoring', code: 'EM01' }] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Location Monitoring', code: 'RM59' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(true)
  })

  it('should return false for both when neither contains valid LM codes', () => {
    const licenceConditions = [{ id: 1, mainDescription: 'Standard condition', code: 'EM0X' }] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Standard requirement', code: 'RMXX' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should handle null or undefined inputs', () => {
    const result = checkLocationMonitoring(null, undefined)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should handle items with undefined descriptions', () => {
    const licenceConditions = [{ id: 1 } as LicenceCondition]
    const requirements = [{ id: 1 } as Requirement]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should handle empty arrays', () => {
    const result = checkLocationMonitoring([], [])

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })
})

describe('checkLocationMonitoringCode', () => {
  it('should return true when code contains "EM01"', () => {
    expect(checkLocationMonitoringCode('EM01')).toBe(true)
  })

  it('should return false when code does not contain "EM01"', () => {
    expect(checkLocationMonitoringCode('RMXX')).toBe(false)
  })

  it('should handle null or undefined input', () => {
    expect(checkLocationMonitoringCode(null)).toBe(false)
    expect(checkLocationMonitoringCode(undefined)).toBe(false)
  })

  it('should handle empty string', () => {
    expect(checkLocationMonitoringCode('')).toBe(false)
  })
})

describe('checkLocationMonitoringByEventNumber', () => {
  const sentences = [
    {
      eventNumber: '1',
      licenceConditions: [{ mainDescription: 'Location Monitoring - GPS', code: 'EM01' }],
      requirements: [],
    },
    {
      eventNumber: '2',
      licenceConditions: [],
      requirements: [{ description: 'Location Monitoring - Curfew', code: 'RM59' }],
    },
    {
      eventNumber: '3',
      licenceConditions: [{ mainDescription: 'Regular condition' }],
      requirements: [{ description: 'Regular requirement', code: 'EM03' }],
    },
  ] as unknown as Sentence[]

  it('should return true for licence conditions when event matches and has LM data', () => {
    const result = checkLocationMonitoringByEventNumber('1', sentences)
    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should return true for requirements when event matches and has LM data', () => {
    const result = checkLocationMonitoringByEventNumber('2', sentences)
    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(true)
  })

  it('should return false when event matches but has no LM data', () => {
    const result = checkLocationMonitoringByEventNumber('3', sentences)
    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should return false when event number does not match', () => {
    const result = checkLocationMonitoringByEventNumber('4', sentences)
    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })
})

describe('hasLocationMonitoring', () => {
  it('should return true if licence conditions have location monitoring code', () => {
    const licenceConditions = [{ mainDescription: 'Location Monitoring', code: 'EM01' }] as any
    const result = hasLocationMonitoring(licenceConditions, [])
    expect(result).toBe(true)
  })

  it('should return true if requirements have location monitoring code', () => {
    const requirements = [{ description: 'Location Monitoring', code: 'RM59' }] as any
    const result = hasLocationMonitoring([], requirements)
    expect(result).toBe(true)
  })

  it('should return true if both have location monitoring code', () => {
    const licenceConditions = [{ mainDescription: 'Location Monitoring', code: 'EM01' }] as any
    const requirements = [{ description: 'Location Monitoring', code: 'RM59' }] as any
    const result = hasLocationMonitoring(licenceConditions, requirements)
    expect(result).toBe(true)
  })

  it('should return false if neither have location monitoring code', () => {
    const licenceConditions = [{ mainDescription: 'Regular', code: 'TEMP' }] as any
    const requirements = [{ description: 'Regular', code: 'TEMP' }] as any
    const result = hasLocationMonitoring(licenceConditions, requirements)
    expect(result).toBe(false)
  })

  it('should handle null or undefined inputs', () => {
    expect(hasLocationMonitoring(null, undefined)).toBe(false)
  })
})
