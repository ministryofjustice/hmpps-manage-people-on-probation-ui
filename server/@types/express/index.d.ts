import type { UserDetails } from '../../services/userService'
import { Errors } from '../../models/Errors'
import { ActivityLogCache } from '../index'
import { DocumentLevel } from '../../data/model/documents'
import { Data } from '../../models/Data'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    [key: string]: string | undefined
    returnTo: string
    nowInMinutes: number
    mas?: Mas.MasData
    page: string
    sortBy: string
    caseFilter: CaseFilter
    activityLogFilters?: ActivityLogFilters
    documentFilters?: DocumentFilters
    documentLevels?: DocumentLevel[]
    data?: Data
    errors?: Errors
    errorMessages?: Record<string, string>
    cache?: {
      activityLog: ActivityLogCache
    }
  }

  interface DocumentFilters {
    [key: string]: string
    fileName?: string
    query?: string
    documentLevel?: string
    dateFrom?: string
    dateTo?: string
  }

  interface CaseFilter {
    [key: string]: string | undefined
    nameOrCrn: string
    sentenceCode: string
    nextContactCode: string
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
    }
  }

  namespace Mas {
    interface MasData {
      hasStaffRecord: boolean
      provider?: string
      team?: string
      teamCount: number
    }
  }
}
