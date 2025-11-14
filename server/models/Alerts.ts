import { Officer } from '../data/model/schedule'

export interface UserAlertsType {
  description: string
  editable: boolean
}

export interface UserAlertsContent {
  id: number
  type: UserAlertsType
  crn: string
  name: string
  date: string
  description?: string
  notes?: string
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

export interface ClearAlertsResponse {
  success: boolean
  clearedCount: number
}
