import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getCurrentOutcome } from './getCurrentOutcome'
import { Activity } from '../../data/model/schedule'

const buildResponse = (appointment: Partial<Activity>) => {
  const locals = {
    appointmentOutcome: {
      appointment,
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()
const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/getCurrentOutcome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should set the correct current outcome if appointment has no outcome', () => {
    const appointment: Partial<Activity> = { hasOutcome: false }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Not started',
      reason: null,
      tagColour: 'BLUE',
    })
  })
  it(`should set the correct current outcome if appointment outcome is rescheduled`, () => {
    const appointment: Partial<Activity> = { hasOutcome: true, rescheduled: true }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Rescheduled',
      reason: null,
      tagColour: 'BLUE',
    })
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it(`should set the correct current outcome if appointment outcome is complied`, () => {
    const appointment: Partial<Activity> = { hasOutcome: true, didTheyComply: true, wasAbsent: false }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Complied',
      reason: null,
      tagColour: 'GREEN',
    })
  })
  it(`should set the correct current outcome if appointment outcome is acceptable absence`, () => {
    const appointment: Partial<Activity> = {
      hasOutcome: true,
      didTheyComply: true,
      acceptableAbsence: true,
      acceptableAbsenceReason: 'Acceptable absence reason',
      wasAbsent: true,
    }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Acceptable absence',
      reason: 'Acceptable absence reason',
      tagColour: 'GREEN',
    })
  })
  it(`should set the correct current outcome if appointment outcome is unacceptable absence`, () => {
    const appointment: Partial<Activity> = {
      hasOutcome: true,
      didTheyComply: false,
      wasAbsent: true,
      acceptableAbsence: false,
    }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Unacceptable absence',
      reason: null,
      tagColour: 'RED',
    })
  })
  it(`should set the correct current outcome if appointment outcome is attended not complied`, () => {
    const appointment: Partial<Activity> = {
      hasOutcome: true,
      didTheyComply: false,
      wasAbsent: false,
    }
    const res = buildResponse(appointment)
    getCurrentOutcome(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentOutcome).toStrictEqual({
      status: 'Failed to comply',
      reason: null,
      tagColour: 'RED',
    })
  })
})
