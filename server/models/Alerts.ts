import { Officer } from '../data/model/schedule'

export interface UserAlertsType {
  description: string
  editable: boolean
}

export interface UserAlertsContent {
  id: number
  type: UserAlertsType
  crn: string
  date: string
  description?: string
  notes?: string
  officer: Officer
}

export interface UserAlerts {
  content: UserAlertsContent[]
  totalResults: number
  totalPages: number
  page: number
  size: number
}
