import { filterActivities } from './filterActivities'
import { Activity } from '../data/model/schedule'

const activities: Activity[] = [
  {
    id: '1',
    type: 'Responsible Officer Change',
    startDateTime: '2026-01-15T10:17:16Z',
  },
  {
    id: '2',
    type: 'Initial Case Allocation Decision',
    startDateTime: '2026-01-15T10:17:16Z',
  },
  {
    id: '3',
    type: 'Tier Change - Calculated in Auto Tiering Service',
    startDateTime: '2026-01-15T10:17:02Z',
  },
  {
    id: '4',
    type: 'CP/UPW - Appointment/Attendance (NS)',
    startDateTime: '2026-01-15T09:00:00Z',
  },
  {
    id: '5',
    type: 'Court Appearance',
    startDateTime: '2026-01-13T10:17:16Z',
  },
  {
    id: '6',
    type: 'Order/Component Commenced',
    startDateTime: '2026-01-13T10:17:16Z',
  },
]

describe('utils/filterActivities', () => {
  it('Should filter by 2026-01-13T10:17:16Z', () => {
    expect(filterActivities(activities, '2026-01-13T10:17:16Z')).toEqual([
      {
        id: '5',
        startDateTime: '2026-01-13T10:17:16Z',
        type: 'Court Appearance',
      },
      {
        id: '6',
        startDateTime: '2026-01-13T10:17:16Z',
        type: 'Order/Component Commenced',
      },
    ])
  })

  it('Should filter by 2026-01-15T09:00:00Z', () => {
    expect(filterActivities(activities, '2026-01-15T09:00:00Z')).toEqual([
      {
        id: '1',
        startDateTime: '2026-01-15T10:17:16Z',
        type: 'Responsible Officer Change',
      },
      {
        id: '2',
        startDateTime: '2026-01-15T10:17:16Z',
        type: 'Initial Case Allocation Decision',
      },
      {
        id: '3',
        startDateTime: '2026-01-15T10:17:02Z',
        type: 'Tier Change - Calculated in Auto Tiering Service',
      },
      {
        id: '4',
        startDateTime: '2026-01-15T09:00:00Z',
        type: 'CP/UPW - Appointment/Attendance (NS)',
      },
    ])
  })

  it('Should return empty array when activities array is empty', () => {
    expect(filterActivities([] as unknown as Activity[], '2026-01-15T09:00:00Z')).toEqual([])
  })

  it('Should return empty array when no activities match the date', () => {
    expect(filterActivities(activities, '2025-12-01T10:00:00Z')).toEqual([])
  })

  it('Should return single activity when only one matches', () => {
    const singleMatchActivities = [
      {
        type: 'Phone Call',
        startDateTime: '2026-02-01T14:00:00Z',
      },
      {
        type: 'Office Visit',
        startDateTime: '2026-02-02T10:00:00Z',
      },
    ] as unknown as Activity[]

    expect(filterActivities(singleMatchActivities, '2026-02-01T14:00:00Z')).toEqual([
      {
        type: 'Phone Call',
        startDateTime: '2026-02-01T14:00:00Z',
      },
    ])
  })
})
