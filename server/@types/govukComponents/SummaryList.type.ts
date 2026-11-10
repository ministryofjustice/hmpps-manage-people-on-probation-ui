// Options for the govukSummaryList Nunjucks macro
// https://design-system.service.gov.uk/components/summary-list/#options-summary-list-example

import { Attributes, TextOrHtml } from './Common.type'

export type SummaryListContent = TextOrHtml & {
  classes?: string
}

export type SummaryListActionItem = TextOrHtml & {
  href: string
  visuallyHiddenText?: string
  classes?: string
  attributes?: Attributes
}

export type SummaryListActions = {
  items?: SummaryListActionItem[]
  classes?: string
}

export type SummaryListRow = {
  classes?: string
  key: SummaryListContent
  value: SummaryListContent
  actions?: SummaryListActions
}

export type SummaryListCard = {
  title?: {
    text?: string
    html?: string
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    classes?: string
  }
  actions?: SummaryListActions
  classes?: string
  attributes?: Attributes
}

export type SummaryList = {
  rows: SummaryListRow[]
  card?: SummaryListCard
  classes?: string
  attributes?: Attributes
}
