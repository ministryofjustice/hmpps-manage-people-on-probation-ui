import type { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import type { Activity } from '../data/model/schedule'

// Derived from the library's own method signature so the shapes never drift apart
export type SupervisionPackageResponse = Awaited<ReturnType<MPoPComponents['getSupervisionPackage']>>
export type SupervisionPackage = NonNullable<SupervisionPackageResponse['supervisionPackage']>

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
