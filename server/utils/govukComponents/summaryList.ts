import { SummaryListRow } from '../../@types'

export const summaryListRow = (
  label: string,
  value: string = '',
  options: { valueFormat?: 'text' | 'html' } = {},
): SummaryListRow => {
  const { valueFormat = 'text' } = options

  return {
    key: { text: label },
    value: valueFormat === 'html' ? { html: value } : { text: value },
  }
}
