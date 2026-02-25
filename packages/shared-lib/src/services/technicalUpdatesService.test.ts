import { TechnicalUpdate } from './technicalUpdatesService'

describe('TechnicalUpdatesService', () => {
  const mockPath = './technicalUpdates.json'

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

  beforeEach(() => {
    jest.resetModules()

    jest.mock('path', () => ({
      ...jest.requireActual('path'),
      join: jest.fn(() => mockPath),
    }))

    jest.mock('fs', () => ({
      readFileSync: jest.fn(() => JSON.stringify(mockTechnicalUpdatesData)),
    }))
  })

  it('should read file using path.join result', async () => {
    const fs = await import('fs')
    const { default: TechnicalUpdatesService } = await import('./technicalUpdatesService')

    const service = new TechnicalUpdatesService()
    const updates = service.getTechnicalUpdates()

    expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf-8')
    expect(updates).toEqual(mockTechnicalUpdatesData)
  })
})
