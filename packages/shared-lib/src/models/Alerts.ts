import { Name } from '../data/model/personalDetails'
import { Note } from '../data/model/note'
import { Officer } from '../data/model/schedule'

export interface UserAlertsType {
  description: string
  editable: boolean
}

export interface UserAlertsContent {
  id: number
  type: UserAlertsType
  crn: string
  name: Name
  date: string
  description?: string
  alertNotes?: Note[]
  alertNote?: Note
  officer: Officer
  riskLevel?: 'VERY HIGH ROSH' | 'HIGH ROSH' | 'MEDIUM ROSH' | 'LOW ROSH'
}

export interface UserAlerts {
  content: UserAlertsContent[]
  totalResults: number
  totalPages: number
  page: number
  size: number
}

export interface ClearAlertsRequest {
  alertIds: number[]
}
