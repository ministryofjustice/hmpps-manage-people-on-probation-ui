import httpMocks from 'node-mocks-http'
import { groupActivitiesByDate } from '.'
import { Activity } from '../data/model/schedule'
import { AppResponse } from '../models/Locals'
import { overrideDeliusManagedFlag } from './overrideDeliusManagedFlag'

const mockMiddlewareFn = jest.fn()
jest.mock('./overrideDeliusManagedFlag', () => ({
  overrideDeliusManagedFlag: jest.fn(() => mockMiddlewareFn),
}))

const mockOverrideDeliusManagedFlag = overrideDeliusManagedFlag as jest.MockedFunction<typeof overrideDeliusManagedFlag>

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

const req = httpMocks.createRequest()

const buildResponse = (enablePreSentence = true) => {
  const mockRes = httpMocks.createResponse() as AppResponse
  mockRes.locals.flags = { enablePreSentence }
  return mockRes
}

describe('utils/groupActivitiesByDate', () => {
  it('should group activities on the same date together', () => {
    const res = buildResponse()
    const result = groupActivitiesByDate(activities)(req, res)
    expect(mockOverrideDeliusManagedFlag).not.toHaveBeenCalled()
    expect(result).toHaveLength(3)
    expect(result[0].activities).toHaveLength(2)
    expect(result[0].activities[0].id).toEqual('1')
    expect(result[0].activities[1].id).toEqual('2')
  })

  it('should return groups in the order they appear', () => {
    const res = buildResponse()
    const result = groupActivitiesByDate(activities)(req, res)
    expect(mockOverrideDeliusManagedFlag).not.toHaveBeenCalled()
    expect(result[0].date).toEqual('Tue 13 Jan 2026')
    expect(result[1].date).toEqual('Wed 14 Jan 2026')
    expect(result[2].date).toEqual('Thu 15 Jan 2026')
  })

  it('should return single activity groups correctly', () => {
    const res = buildResponse()
    const result = groupActivitiesByDate(activities)(req, res)
    expect(mockOverrideDeliusManagedFlag).not.toHaveBeenCalled()
    expect(result[1].activities).toHaveLength(1)
    expect(result[1].activities[0].id).toEqual('3')
    expect(result[2].activities).toHaveLength(1)
    expect(result[2].activities[0].id).toEqual('4')
  })

  it('should return empty array for empty input', () => {
    const res = buildResponse()
    const result = groupActivitiesByDate([])(req, res)
    expect(mockOverrideDeliusManagedFlag).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should handle single activity', () => {
    const res = buildResponse()
    const singleActivity = [activities[0]] as Activity[]
    const result = groupActivitiesByDate(singleActivity)(req, res)
    expect(mockOverrideDeliusManagedFlag).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0].activities).toHaveLength(1)
    expect(result[0].activities[0].id).toEqual('1')
  })

  it('should call overrideDeliusManagedFlag when enablePreSentence flag is false', () => {
    const res = buildResponse(false)
    const result = groupActivitiesByDate(activities)(req, res)
    expect(mockOverrideDeliusManagedFlag).toHaveBeenCalled()
  })
})
