import type { Activity } from '../data/model/schedule'

export type SupervisionPackageResponse = {
  supervisionPackage: SupervisionPackage | null
  httpStatus: number
  error?: Error | null
}

export type SupervisionPackage = {
  phase: {
    name: {
      code: string
      description: string
    }
    startDate: string
    endDate: string
  }
  earlyEngagement: {
    startDate: string
    endDate: string
    weeks: number
    completed: number
  }
  currentYear: {
    startDate: string
    endDate: string
    isFirstYear: boolean
    appointments: {
      allowance: number
      scheduled: number
      completed: number
    }
  }
  inputs: {
    date: string
    gender: string
    integratedOffenderManagementRedRated: boolean
    offenderPersonalDisorderPathway: boolean
    intensiveSupervisionCourt: boolean
    nationalSecurityDivision: boolean
    contactSuspendedDate?: string
    finalThirdEligibility: {
      eligible: boolean
      since: string
    }
    sentences: Array<Sentence>
  }
}
type Sentence = {
  eventNumber: string
  startDate: string
  endDate: string
  supervisionPackage: {
    code: string
    description: string
  }
  type: {
    code: string
    description: string
    isCustodial: boolean
  }
  custody: {
    status: {
      code: string
      description: string
    }
    finalThirdDate: string
    releases: Array<Release>
  }
  inBreach: boolean
}
type Release = {
  releaseDate: string
  recallDate?: string
}

export type NextAppointmentResponse = {
  personSchedule: PersonSchedule | null
  httpStatus: number
  error?: Error | null
}

export type PersonSchedule = {
  personSummary: {
    name: {
      forename: string
      middleName?: string
      surname: string
      username?: string
    }
    crn: string
    offenderId?: number
    pnc?: string
    dateOfBirth: string
    preferredLanguage?: string
  }
  personSchedule: {
    size: number
    page: number
    totalResults: number
    totalPages: number
    appointments: Array<Activity>
  }
}
