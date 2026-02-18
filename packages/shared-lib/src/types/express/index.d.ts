import { type UserDetails } from '../../services/userService'
import { type Errors } from '../../models/Errors'
import { type DocumentLevel } from '../../data/model/documents'
import { type Data } from '../../models/Data'
import { ActivityLogFilters } from '../../models/ActivityLog'
import { FileCache } from '../FileUpload'

// export default {}

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] }
    }
  }
}

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
    alertDismissed?: boolean
    cache?: {
      activityLog?: any
      uploadedFiles?: FileCache[]
    }
    body?: Record<string, any>
  }

  interface DocumentFilters {
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

declare global {
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
