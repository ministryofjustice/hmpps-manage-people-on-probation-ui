export interface Errors {
  errorList: { text: string; href: string }[]
  errorMessages: {
    [anchor: string]: { text: string }
  }
}
