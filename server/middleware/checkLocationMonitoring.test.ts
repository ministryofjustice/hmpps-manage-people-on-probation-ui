import {
  checkLocationMonitoring,
  checkLocationMonitoringByEventNumber,
  hasLocationMonitoring,
  checkLocationMonitoringString,
} from './checkLocationMonitoring'
import { LicenceCondition, Requirement, Sentence } from '../data/model/sentenceDetails'

describe('checkLocationMonitoring', () => {
  it('should return true for hasLicenceConditionsLMData when a licence condition contains "location monitoring"', () => {
    const licenceConditions = [
      { id: 1, mainDescription: 'This is a Location Monitoring condition' },
    ] as LicenceCondition[]
    const requirements = [] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should return true for hasRequirementsLMData when a requirement contains "location monitoring"', () => {
    const licenceConditions = [] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Requirement with Location Monitoring' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(true)
  })

  it('should return true for both when both contain "location monitoring"', () => {
    const licenceConditions = [{ id: 1, mainDescription: 'Location Monitoring' }] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Location Monitoring' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(true)
  })

  it('should return false for both when neither contains "location monitoring"', () => {
    const licenceConditions = [{ id: 1, mainDescription: 'Standard condition' }] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'Standard requirement' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(false)
    expect(result.hasRequirementsLMData).toBe(false)
  })

  it('should be case-insensitive', () => {
    const licenceConditions = [{ id: 1, mainDescription: 'LOCATION MONITORING' }] as LicenceCondition[]
    const requirements = [{ id: 1, description: 'location monitoring' }] as Requirement[]

    const result = checkLocationMonitoring(licenceConditions, requirements)

    expect(result.hasLicenceConditionsLMData).toBe(true)
    expect(result.hasRequirementsLMData).toBe(true)
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

describe('checkLocationMonitoringString', () => {
  it('should return true when description contains "location monitoring"', () => {
    expect(checkLocationMonitoringString('This is a Location Monitoring condition')).toBe(true)
  })

  it('should return false when description does not contain "location monitoring"', () => {
    expect(checkLocationMonitoringString('Standard condition')).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(checkLocationMonitoringString('LOCATION MONITORING')).toBe(true)
    expect(checkLocationMonitoringString('location monitoring')).toBe(true)
  })

  it('should handle null or undefined input', () => {
    expect(checkLocationMonitoringString(null)).toBe(undefined)
    expect(checkLocationMonitoringString(undefined)).toBe(undefined)
  })

  it('should handle empty string', () => {
    expect(checkLocationMonitoringString('')).toBe(false)
  })
})

describe('checkLocationMonitoringByEventNumber', () => {
  const sentences = [
    {
      eventNumber: '1',
      licenceConditions: [{ mainDescription: 'Location Monitoring - GPS' }],
      requirements: [],
    },
    {
      eventNumber: '2',
      licenceConditions: [],
      requirements: [{ description: 'Location Monitoring - Curfew' }],
    },
    {
      eventNumber: '3',
      licenceConditions: [{ mainDescription: 'Regular condition' }],
      requirements: [{ description: 'Regular requirement' }],
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
  it('should return true if licence conditions have location monitoring', () => {
    const licenceConditions = [{ mainDescription: 'Location Monitoring' }] as any
    const result = hasLocationMonitoring(licenceConditions, [])
    expect(result).toBe(true)
  })

  it('should return true if requirements have location monitoring', () => {
    const requirements = [{ description: 'Location Monitoring' }] as any
    const result = hasLocationMonitoring([], requirements)
    expect(result).toBe(true)
  })

  it('should return true if both have location monitoring', () => {
    const licenceConditions = [{ mainDescription: 'Location Monitoring' }] as any
    const requirements = [{ description: 'Location Monitoring' }] as any
    const result = hasLocationMonitoring(licenceConditions, requirements)
    expect(result).toBe(true)
  })

  it('should return false if neither have location monitoring', () => {
    const licenceConditions = [{ mainDescription: 'Regular' }] as any
    const requirements = [{ description: 'Regular' }] as any
    const result = hasLocationMonitoring(licenceConditions, requirements)
    expect(result).toBe(false)
  })

  it('should handle null or undefined inputs', () => {
    expect(hasLocationMonitoring(null, undefined)).toBe(false)
  })
})
