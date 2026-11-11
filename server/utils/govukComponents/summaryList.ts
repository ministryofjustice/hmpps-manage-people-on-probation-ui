import { SummaryListRow } from '../../@types'

export const summaryListRow = (
  label: string,
  value: string = '',
  options: { valueFormat?: 'text' | 'html'; ignoreEmpty?: boolean; defaultText?: string } = {},
): SummaryListRow => {
  const { valueFormat = 'text', ignoreEmpty = false, defaultText } = options

  let renderValue = valueFormat === 'html' ? { html: value } : { text: value }

  if (!value) {
    if (ignoreEmpty) {
      return undefined
    }
    if (defaultText) {
      renderValue = { text: defaultText }
    }
  }

  return {
    key: { text: label },
    value: renderValue,
  }
}

export const filterEmptyValues = (rows: SummaryListRow[]): SummaryListRow[] =>
  rows.filter(row => row.value.text?.trim() || row.value.html?.trim())

export const replaceEmptyValues = (rows: SummaryListRow[], defaultText: string): SummaryListRow[] =>
  rows.map(row => {
    if (row.value.text?.trim() || row.value.html?.trim()) {
      return row
    }

    return {
      ...row,
      value: { text: defaultText },
    }
  })
