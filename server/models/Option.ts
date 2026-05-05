export interface Option<TValue = string> {
  text?: string
  value?: TValue
  hint?: {
    text: string
  }
  divider?: string
  checked?: boolean
}
