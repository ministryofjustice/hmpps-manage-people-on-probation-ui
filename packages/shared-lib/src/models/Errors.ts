export interface Errors {
  errorList: { text: string; href: string }[]
  errorMessages: {
    [anchor: string]: { text: string }
  }
}

export interface Validateable {
  [index: string]: string | boolean
}

export interface ErrorCheck {
  validator: (...args: any[]) => boolean
  msg: string
  length?: number
  crossField?: string
  isActive?: boolean
  log?: string
}

export interface ErrorChecks {
  optional: boolean
  mandatoryWhenFieldSet?: string
  mandatoryMsg?: string
  checks: ErrorCheck[]
}

export interface ValidationSpec {
  [index: string]: ErrorChecks
}
