import fs from 'fs'
import TechnicalUpdatesService from './technicalUpdatesService'

jest.mock('../config', () => ({
  guidance: {
    link: 'http://guidance-link',
  },
}))

jest.mock('fs', () => {
  const mockFiles: Record<string, string> = {
    '2025-09-23.md': [
      '---',
      'heading: Welcome to Manage people on probation',
      'date: 2025-09-23',
      '---',
      'Initial setup, see <a href="{{guidanceUrl}}/practitioner-guidance" target="_blank">our guidance (opens in new tab)</a>.',
    ].join('\n'),
    '2025-10-31.md': [
      '---',
      'heading: View all outcomes to log on one page',
      'date: 2025-10-31',
      '---',
      '### Manage appointments',
      '',
      'You can now:',
      '',
      '- view appointments',
      '- email mpop-digital-team@justice.gov.uk',
    ].join('\n'),
    'README.txt': 'Not an update',
  }

  return {
    readdirSync: jest.fn(() => Object.keys(mockFiles)),
    readFileSync: jest.fn((file: string) => mockFiles[file.replace(/^.*\//, '')]),
  }
})

describe('TechnicalUpdatesService', () => {
  let technicalUpdatesService: TechnicalUpdatesService

  beforeAll(() => {
    technicalUpdatesService = new TechnicalUpdatesService()
  })

  describe('getTechnicalUpdates', () => {
    it('should load markdown files from the whats-new directory, latest first', () => {
      const updates = technicalUpdatesService.getTechnicalUpdates()

      expect(fs.readdirSync).toHaveBeenCalledWith('./whats-new')
      expect(updates).toHaveLength(2)
      expect(updates.map(({ heading, date }) => ({ heading, date }))).toEqual([
        { heading: 'View all outcomes to log on one page', date: '2025-10-31' },
        { heading: 'Welcome to Manage people on probation', date: '2025-09-23' },
      ])
    })

    it('should render markdown to HTML', () => {
      const { html } = technicalUpdatesService.getTechnicalUpdates()[0]

      expect(html).toContain('<h3>Manage appointments</h3>')
      expect(html).toContain('<p>You can now:</p>')
      expect(html).toContain('<ul>\n<li>view appointments</li>')
      expect(html).toContain('<a href="mailto:mpop-digital-team@justice.gov.uk">mpop-digital-team@justice.gov.uk</a>')
    })

    it('should substitute the guidance URL', () => {
      const { html } = technicalUpdatesService.getTechnicalUpdates()[1]

      expect(html).toContain(
        '<a href="http://guidance-link/practitioner-guidance" target="_blank">our guidance (opens in new tab)</a>',
      )
    })
  })

  describe('getLatestTechnicalUpdateHeading', () => {
    it('should return the heading of the latest technical update', () => {
      expect(technicalUpdatesService.getLatestTechnicalUpdateHeading()).toEqual('View all outcomes to log on one page')
    })
  })
})
