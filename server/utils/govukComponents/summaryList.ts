import { SummaryListRow } from '../../@types'

export const summaryListRow = (
  label: string,
  value: string = '',
  options: { valueFormat?: 'text' | 'html'; ignoreEmpty?: boolean } = {},
): SummaryListRow => {
  const { valueFormat = 'text', ignoreEmpty = false } = options

  if (!value && ignoreEmpty) {
    return undefined
  }

  return {
    key: { text: label },
    value: valueFormat === 'html' ? { html: value } : { text: value },
  }
}

export const filterEmptyValues = (rows: SummaryListRow[]): SummaryListRow[] =>
  rows.filter(row => row.value.text?.trim() || row.value.html?.trim())
