import { summaryListRow } from './summaryList'

describe('SummaryList helpers', () => {
  describe('summaryListRows', () => {
    it('renders a basic summary list row', () => {
      expect(summaryListRow('Label text', 'Value text')).toEqual({
        key: { text: 'Label text' },
        value: { text: 'Value text' },
      })
    })

    it('renders a summary list row with html value', () => {
      expect(summaryListRow('Label text', '<p>Value html</p>', { valueFormat: 'html' })).toEqual({
        key: { text: 'Label text' },
        value: { html: '<p>Value html</p>' },
      })
    })

    it('renders empty strings for undefined values', () => {
      expect(summaryListRow('Label', undefined)).toEqual({
        key: { text: 'Label' },
        value: { text: '' },
      })
    })
  })
})
