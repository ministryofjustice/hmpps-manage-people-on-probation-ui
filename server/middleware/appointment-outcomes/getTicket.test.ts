import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { Compliance, NonComplianceContact, NonComplianceHistoryResponse } from '../../data/model/overview'
import { getTicket } from './getTicket'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { SentenceType } from '../../data/model/sentenceDetails'

const crn = 'X000001'
const forename = 'Stuart'

jest.mock('../../data/hmppsAuthClient')
jest.mock('../../data/masApiClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

const getPersonNonComplianceDetailSpy = jest.spyOn(MasApiClient.prototype, 'getPersonNonComplianceDetail')

const nonComplianceContact: NonComplianceContact = {
  contactId: 123456,
  eventNumber: '3',
  eventId: 3,
  type: {
    code: 'NS',
    description: 'Planned Office Visit (NS)',
  },
  date: '2024-05-18',
}

interface Args {
  unacceptableAbsence?: NonComplianceContact[]
  attendedButDidNotComply?: NonComplianceContact[]
  acceptableAbsence?: NonComplianceContact[]
}

const mockPersonNonComplianceDetailResponse = ({
  unacceptableAbsence = [],
  attendedButDidNotComply = [],
  acceptableAbsence = [],
}: Args = {}): NonComplianceHistoryResponse => ({
  unacceptableAbsence,
  attendedButDidNotComply,
  acceptableAbsence,
})

const mockCompliance = ({ breachCount = 1, recallCount = 0 }): Partial<Compliance> => ({
  priorBreachesOnCurrentOrderCount: breachCount,
  priorRecallsOnCurrentOrderCount: recallCount,
})

const buildResponse = ({
  breachCount = 1,
  recallCount = 0,
  type = 'COMMUNITY',
  reqUrl = '/outcome/attended-failed-to-comply',
}: {
  breachCount?: number
  recallCount?: number
  type?: SentenceType
  reqUrl?: string
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      reqUrl,
      forename,
      crn,
      sentence: {
        type,
        compliance: mockCompliance({ breachCount, recallCount }),
      },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()
const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/getTicket', () => {
  const pages = [
    { title: 'Attended - failed to comply', url: '/outcome/attended-failed-to-comply' },
    { title: 'Unacceptable absence', url: '/outcome/unacceptable-absence' },
  ]
  pages.forEach(({ title, url: reqUrl }) => {
    describe(title, () => {
      it('should not assign a ticket if no previous failures to comply', async () => {
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(mockPersonNonComplianceDetailResponse())
        const res = buildResponse({ reqUrl })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toBeNull()
      })
      it('should assign the correct ticket if sentence type is COMMUNITY, one previous FTC, no previous breach', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply }),
        )
        const res = buildResponse({ breachCount: 0 })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
          expect.objectContaining({
            title: 'This is Stuart’s second count of non-compliance in the past 12 months',
            html: expect.stringContaining('You should consider initiating a breach'),
          }),
        )
      })
      it('should assign the correct ticket if sentence type is CUSTODY, one previous FTC, no previous breach', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply }),
        )
        const res = buildResponse({ type: 'CUSTODY', recallCount: 0 })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
          expect.objectContaining({
            title: 'This is Stuart’s second count of non-compliance in the past 12 months',
            html: expect.stringContaining('You should consider initiating a recall'),
          }),
        )
      })
      it('should assign the correct ticket if sentence type is COMMUNITY, more than one previous FTC, no previous breach', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        const unacceptableAbsence: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply, unacceptableAbsence }),
        )
        const res = buildResponse({ breachCount: 0 })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
          expect.objectContaining({
            title: 'Stuart has had multiple counts of non-compliance in the past 12 months',
            html: expect.stringContaining('You should consider initiating a breach'),
          }),
        )
      })

      it('should assign the correct ticket if sentence type is CUSTODY, more than one previous FTC, no previous recall', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        const unacceptableAbsence: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply, unacceptableAbsence }),
        )
        const res = buildResponse({ type: 'CUSTODY' })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toEqual(
          expect.objectContaining({
            html: expect.stringContaining('You should consider initiating a recall'),
            title: 'Stuart has had multiple counts of non-compliance in the past 12 months',
            type: 'RED',
          }),
        )
      })

      it('should assign the correct ticket if sentence type is COMMUNIUTY, more than one previous FTC, previous breach', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        const unacceptableAbsence: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply, unacceptableAbsence }),
        )
        const res = buildResponse({ breachCount: 1 })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
          expect.objectContaining({
            title: 'Stuart has had multiple counts of non-compliance in the past 12 months',
            html: expect.stringContaining('Stuart has breached this sentence before'),
          }),
        )
      })
      it('should assign the correct ticket if sentence type is CUSTODY, more than one previous FTC, previous recall', async () => {
        const attendedButDidNotComply: NonComplianceContact[] = [nonComplianceContact]
        const unacceptableAbsence: NonComplianceContact[] = [nonComplianceContact]
        getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
          mockPersonNonComplianceDetailResponse({ attendedButDidNotComply, unacceptableAbsence }),
        )
        const res = buildResponse({ type: 'CUSTODY', breachCount: 0, recallCount: 1 })
        await getTicket(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.ticket).toEqual(
          expect.objectContaining({
            title: 'Stuart has had multiple counts of non-compliance in the past 12 months',
            html: expect.stringContaining('Stuart has been recalled before'),
          }),
        )
      })
    })
  })

  describe('Acceptable absence', () => {
    it('should not assign a ticket if no previous acceptable absence', async () => {
      getPersonNonComplianceDetailSpy.mockResolvedValueOnce(mockPersonNonComplianceDetailResponse())
      const res = buildResponse({ reqUrl: '/outcome/acceptable-absence' })
      await getTicket(hmppsAuthClient)(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.ticket).toBeNull()
    })
    it('should assign the correct ticket if multiple acceptable absences', async () => {
      const acceptableAbsence: NonComplianceContact[] = [nonComplianceContact, nonComplianceContact]
      getPersonNonComplianceDetailSpy.mockResolvedValueOnce(
        mockPersonNonComplianceDetailResponse({ acceptableAbsence }),
      )
      const res = buildResponse({ reqUrl: '/outcome/acceptable-absence' })
      await getTicket(hmppsAuthClient)(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
        expect.objectContaining({
          title: 'Stuart has had multiple acceptable absences in the past 12 months',
        }),
      )
    })
  })
})
