import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { BreachOrRecall } from '../../data/model/compliance'
import { AppointmentOutcomeSentence, AppResponse, BreachOrRecallWarning } from '../../models/Locals'
import { getBreachOrRecallWarning } from './getBreachOrRecallWarning'
import { Compliance } from '../../data/model/overview'

const breachOrRecall: BreachOrRecall = { startDate: '2026-06-03', status: '' }

const mockSentence: AppointmentOutcomeSentence = {
  type: 'COMMUNITY',
  length: 12,
  eventId: 1234,
  eventNumber: '5678',
  order: 'ORA Community Order',
  youth: false,
  pss: false,
  activeBreach: null,
  activeRecall: null,
  compliance: {} as Compliance,
}

const buildResponse = ({ sentence = {} }: { sentence?: Partial<AppointmentOutcomeSentence> } = {}): AppResponse => {
  const response = {
    appointmentOutcome: {
      sentence: {
        ...mockSentence,
        ...sentence,
      },
    },
  }
  return mockAppResponse(response)
}

const req = httpMocks.createRequest()

const nextSpy = jest.fn()

describe('/middleware/appointment-outcomes/getBreachOrRecallWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should assign null to res.locals.appointmntOutcomes.breachOrRecallWarning if no eventId', () => {
    const sentence: Partial<AppointmentOutcomeSentence> = { eventId: null }
    const res = buildResponse({ sentence })
    getBreachOrRecallWarning(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should assign null to res.locals.appointmntOutcomes.breachOrRecallWarning if sentence type is COMMUNITY and no active breach', () => {
    const res = buildResponse()
    getBreachOrRecallWarning(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should assign null to res.locals.appointmntOutcomes.breachOrRecallWarning if sentence type is COMMUNITY and no active recall', () => {
    const sentence: Partial<AppointmentOutcomeSentence> = { type: 'CUSTODY' }
    const res = buildResponse({ sentence })
    getBreachOrRecallWarning(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should assign the breach warning to res.locals.appointmntOutcomes.breachOrRecallWarning if sentence type is COMMUNITY and has an active breach', () => {
    const sentence: Partial<AppointmentOutcomeSentence> = { activeBreach: breachOrRecall }
    const res = buildResponse({ sentence })
    const expected: BreachOrRecallWarning = {
      title: 'There is a live breach for this sentence',
      text: `The breach for ORA community order was initiated on 3 June 2026.`,
      type: 'BREACH',
    }
    getBreachOrRecallWarning(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toStrictEqual(expected)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should assign the recall warning to res.locals.appointmntOutcomes.breachOrRecallWarning if sentence type is CUSTODY and has an active recall', () => {
    const sentence: Partial<AppointmentOutcomeSentence> = { type: 'CUSTODY', activeRecall: breachOrRecall }
    const res = buildResponse({ sentence })
    const expected: BreachOrRecallWarning = {
      title: 'There is a live recall for this sentence',
      text: `The recall for ORA community order was initiated on 3 June 2026.`,
      type: 'RECALL',
    }
    getBreachOrRecallWarning(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toStrictEqual(expected)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
