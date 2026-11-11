import { filterEmptyValues, summaryListRow } from './summaryList'

describe('SummaryList helpers', () => {
  describe('summaryListRows', () => {
    it('renders a basic summary list row', () => {
      expect(summaryListRow('Label text', 'Value text')).toEqual({
        key: { text: 'Label text' },
        value: { text: 'Value text' },
      })
    })

    it('renders empty strings for undefined values', () => {
      expect(summaryListRow('Label', undefined)).toEqual({
        key: { text: 'Label' },
        value: { text: '' },
      })
    })

    describe('options', () => {
      it('renders a summary list row with html value if valueFormat option is html', () => {
        expect(summaryListRow('Label text', '<p>Value html</p>', { valueFormat: 'html' })).toEqual({
          key: { text: 'Label text' },
          value: { html: '<p>Value html</p>' },
        })
      })

      it('renders nothing if ignoreEmpty option is true', () => {
        expect(summaryListRow('Label', '', { ignoreEmpty: true })).toBeUndefined()
      })
    })
  })

  describe('filterEmptyValues', () => {
    it('filters out summary list rows with empty values', () => {
      const result = filterEmptyValues([
        summaryListRow('One', undefined),
        summaryListRow('Two', 'Content'),
        summaryListRow('Three', '  ', { valueFormat: 'html' }),
        summaryListRow('Four', '  '),
      ])

      expect(result).toEqual([summaryListRow('Two', 'Content')])
    })
  })
})
