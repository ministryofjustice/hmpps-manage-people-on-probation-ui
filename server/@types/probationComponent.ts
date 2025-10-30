export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export interface ComponentsResponse {
  header?: Component
  footer?: Component
}
