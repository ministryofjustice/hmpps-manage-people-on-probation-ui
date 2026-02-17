import fs from 'fs'
import TechnicalUpdatesService, { TechnicalUpdate } from './technicalUpdatesService'

jest.mock('fs', () => {
  const mockTechnicalUpdatesData: TechnicalUpdate[] = [
    {
      heading: 'View all outcomes to log on one page and other service improvements',
      summary: '31 October 2025',
      whatsNew: ['View all outcomes to log on one page', 'Manage appointments in this service'],
    },
    {
      heading: 'Welcome to Manage people on probation',
      summary: '23 September 2025',
      whatsNew: ['Initial setup'],
      technicalFixes: ['Minor styling fixes'],
    },
  ]

  const mockFileContent = JSON.stringify(mockTechnicalUpdatesData)

  return {
    readFileSync: jest.fn(() => ({
      toString: jest.fn(() => mockFileContent),
    })),
  }
})

const mockTechnicalUpdatesData: TechnicalUpdate[] = [
  {
    heading: 'View all outcomes to log on one page and other service improvements',
    summary: '31 October 2025',
    whatsNew: ['View all outcomes to log on one page', 'Manage appointments in this service'],
  },
  {
    heading: 'Welcome to Manage people on probation',
    summary: '23 September 2025',
    whatsNew: ['Initial setup'],
    technicalFixes: ['Minor styling fixes'],
  },
]

describe('TechnicalUpdatesService', () => {
  let technicalUpdatesService: TechnicalUpdatesService

  beforeAll(() => {
    technicalUpdatesService = new TechnicalUpdatesService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getTechnicalUpdates', () => {
    it('should return all technical updates loaded from the file', () => {
      const updates = technicalUpdatesService.getTechnicalUpdates()

      expect(fs.readFileSync).toHaveBeenCalledWith('./technicalUpdates.json')

      expect(updates).toEqual(mockTechnicalUpdatesData)
      expect(updates).toHaveLength(2)
    })
  })

  describe('getLatestTechnicalUpdateHeading', () => {
    it('should return the heading of the first (latest) technical update', () => {
      const latestHeading = technicalUpdatesService.getLatestTechnicalUpdateHeading()

      expect(latestHeading).toEqual(mockTechnicalUpdatesData[0].heading)
      expect(latestHeading).toEqual('View all outcomes to log on one page and other service improvements')
    })
  })
})
