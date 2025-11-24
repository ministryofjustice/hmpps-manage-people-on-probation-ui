import { UserAlerts, UserAlertsContent } from '../../models/Alerts'
import { Officer } from '../../data/model/schedule'
import { Note } from '../../data/model/note'

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
    name: mockName,
    riskLevel: 'HIGH ROSH',
  },
  {
    id: 2,
    type: { description: 'Contact Alert', editable: false },
    crn: 'X000002',
    date: '2025-11-09T09:00:00Z',
    officer: mockOfficer,
    name: mockName,
  },
]

export const mockUserAlerts: UserAlerts = {
  content: mockAlertsContent,
  totalResults: 2,
  totalPages: 1,
  page: 0,
  size: 10,
} as unknown as UserAlerts

export const mockClearAlertsSuccess = {}

export const mockNote: Note = {
  id: 0,
  createdBy: 'Me',
  createdByDate: '11-11-2000',
  note: 'Notes',
  hasNotesBeenTruncated: false,
}

export const defaultUser = {
  username: 'testuser',
  token: 'mock-user-token',
  authSource: 'Ndelius',
}
