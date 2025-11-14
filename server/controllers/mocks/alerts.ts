import { UserAlerts, ClearAlertsResponse, UserAlertsContent } from '../../models/Alerts'
import { Officer } from '../../data/model/schedule'

const mockName = {
  forename: 'John',
  surname: 'Doe',
}

const mockOfficer: Officer = {
  code: 'P01',
  name: mockName,
  teamCode: 'CRONFA',
  providerCode: 'N01',
  username: 'JDOE',
}

export const mockAlertsContent: UserAlertsContent[] = [
  {
    id: 1,
    type: { description: 'ROSH Alert', editable: true },
    crn: 'X000001',
    date: '2025-11-10T10:00:00Z',
    description: 'Test Alert 1',
    officer: mockOfficer,
    riskLevel: 'HIGH ROSH',
  },
  {
    id: 2,
    type: { description: 'Contact Alert', editable: false },
    crn: 'X000002',
    date: '2025-11-09T09:00:00Z',
    officer: mockOfficer,
  },
]

export const mockUserAlerts: UserAlerts = {
  content: mockAlertsContent,
  totalResults: 2,
  totalPages: 1,
  page: 0,
  size: 10,
} as unknown as UserAlerts

export const mockClearAlertsSuccess: ClearAlertsResponse = {
  success: true,
  clearedCount: 2,
}

export const defaultUser = {
  username: 'testuser',
  token: 'mock-user-token',
  authSource: 'Ndelius',
}
