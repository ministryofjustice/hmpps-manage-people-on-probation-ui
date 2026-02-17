import { groupActivitiesByDate } from './groupActivitiesByDate'
import { Activity } from '../data/model/schedule'

const activities: Activity[] = [
  {
    id: '1',
    startDateTime: '2026-01-13T10:00:00Z',
    type: 'Office appointment',
  },
  {
    id: '2',
    startDateTime: '2026-01-13T14:00:00Z',
    type: 'Phone call',
  },
  {
    id: '3',
    startDateTime: '2026-01-14T09:00:00Z',
    type: 'Home visit',
  },
  {
    id: '4',
    startDateTime: '2026-01-15T11:00:00Z',
    type: 'Office appointment',
  },
]

describe('utils/groupActivitiesByDate', () => {
  it('should group activities on the same date together', () => {
    const result = groupActivitiesByDate(activities)

    expect(result).toHaveLength(3)
    expect(result[0].activities).toHaveLength(2)
    expect(result[0].activities[0].id).toEqual('1')
    expect(result[0].activities[1].id).toEqual('2')
  })

  it('should return groups in the order they appear', () => {
    const result = groupActivitiesByDate(activities)

    expect(result[0].date).toEqual('Tue 13 Jan 2026')
    expect(result[1].date).toEqual('Wed 14 Jan 2026')
    expect(result[2].date).toEqual('Thu 15 Jan 2026')
  })

  it('should return single activity groups correctly', () => {
    const result = groupActivitiesByDate(activities)

    expect(result[1].activities).toHaveLength(1)
    expect(result[1].activities[0].id).toEqual('3')
    expect(result[2].activities).toHaveLength(1)
    expect(result[2].activities[0].id).toEqual('4')
  })

  it('should return empty array for empty input', () => {
    const result = groupActivitiesByDate([])

    expect(result).toEqual([])
  })

  it('should handle single activity', () => {
    const singleActivity = [activities[0]] as Activity[]
    const result = groupActivitiesByDate(singleActivity)

    expect(result).toHaveLength(1)
    expect(result[0].activities).toHaveLength(1)
    expect(result[0].activities[0].id).toEqual('1')
  })
})
