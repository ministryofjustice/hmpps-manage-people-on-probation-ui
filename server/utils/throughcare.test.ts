import MoicApiClient from '../data/moicApiClient'
import PrisonRegisterApiClient, { Prison } from '../data/prisonRegisterApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { getThroughcareRows } from './throughcare'
import { summaryListRow } from './govukComponents/summaryList'

jest.mock('../data/moicApiClient')
jest.mock('../data/prisonRegisterApiClient')
jest.mock('../../logger')

const token = 'token-1'
const nomsNumber = 'A1234BC'

const prisonerInCustody: Prisoner = {
  status: 'ACTIVE IN',
  inOutStatus: 'IN',
  prisonId: 'WTI',
  prisonName: 'HMP Whatton',
  lastPrisonId: 'WTI',
  releaseDate: '2027-03-16',
}

const prisonerReleased: Prisoner = {
  status: 'INACTIVE OUT',
  inOutStatus: 'OUT',
  prisonId: 'OUT',
  prisonName: 'Outside',
  lastPrisonId: 'MDI',
  releaseDate: '2025-03-16',
}

const mockPrison: Prison = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP & YOI)',
  active: true,
  male: true,
  female: false,
  contracted: false,
}

const getPomNameSpy = jest.spyOn(MoicApiClient.prototype, 'getPomName')
const getPomToRoHandoverDetailsSpy = jest.spyOn(MoicApiClient.prototype, 'getPomToRoHandoverDetails')
const getPrisonSpy = jest.spyOn(PrisonRegisterApiClient.prototype, 'getPrison')

describe('utils/throughcare', () => {
  beforeEach(() => {
    getPomNameSpy.mockResolvedValue({ primary_pom: { staff_id: 1, name: 'Dove, Rachel' } })
    getPomToRoHandoverDetailsSpy.mockResolvedValue({
      nomsNumber,
      handoverDate: '2026-11-20',
      handoverStartDate: '2026-11-06',
      responsibility: 'POM',
      responsibleComName: 'Com Name',
      responsiblePomName: 'Pom Name',
    })
    getPrisonSpy.mockResolvedValue(mockPrison)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getThroughcareRows', () => {
    it('returns the in custody rows', async () => {
      await expect(getThroughcareRows(token, nomsNumber, prisonerInCustody)).resolves.toEqual({
        rows: [
          summaryListRow('Prison offender manager (POM)', 'Rachel Dove'),
          summaryListRow('Current prison', 'HMP Whatton'),
          summaryListRow('Responsible officer expected handover date', '6 November 2026'),
          summaryListRow('Release date', '16 March 2027'),
        ],
      })

      expect(MoicApiClient).toHaveBeenCalledWith(token)
      expect(getPomNameSpy).toHaveBeenCalledWith(nomsNumber)
      expect(getPomToRoHandoverDetailsSpy).toHaveBeenCalledWith(nomsNumber)
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })

    it('returns the released rows', async () => {
      await expect(getThroughcareRows(token, nomsNumber, prisonerReleased)).resolves.toEqual({
        rows: [
          summaryListRow('Prison offender manager (POM)', 'Rachel Dove'),
          summaryListRow('Last prison', 'Moorland (HMP & YOI)'),
          summaryListRow('Release date', '16 March 2025'),
        ],
      })

      expect(PrisonRegisterApiClient).toHaveBeenCalledWith(token)
      expect(getPomNameSpy).toHaveBeenCalledWith(nomsNumber)
      expect(getPrisonSpy).toHaveBeenCalledWith('MDI')
      expect(getPomToRoHandoverDetailsSpy).not.toHaveBeenCalled()
    })

    it.each([
      ['INACTIVE OUT', 'OUT'],
      ['INACTIVE TRN', 'OUT'],
    ])('returns the released rows when the status is %s and the inOutStatus is %s', async (status, inOutStatus) => {
      const throughcare = await getThroughcareRows(token, nomsNumber, { ...prisonerReleased, status, inOutStatus })

      expect(throughcare.rows.map(({ key }) => key.text)).toEqual([
        'Prison offender manager (POM)',
        'Last prison',
        'Release date',
      ])
    })

    it.each([
      ['ACTIVE IN', 'IN'],
      ['ACTIVE OUT', 'OUT'],
      ['ACTIVE OUT', 'TRN'],
      ['INACTIVE OUT', 'IN'],
      ['INACTIVE TRN', 'TRN'],
      [undefined, undefined],
    ])('returns the in custody rows when the status is %s and the inOutStatus is %s', async (status, inOutStatus) => {
      const throughcare = await getThroughcareRows(token, nomsNumber, { ...prisonerInCustody, status, inOutStatus })

      expect(throughcare.rows.map(({ key }) => key.text)).toEqual([
        'Prison offender manager (POM)',
        'Current prison',
        'Responsible officer expected handover date',
        'Release date',
      ])
    })

    it('does not look up the last prison when the released prisoner has no last prison id', async () => {
      const throughcare = await getThroughcareRows(token, nomsNumber, { ...prisonerReleased, lastPrisonId: undefined })

      expect(throughcare.rows.find(row => row.key.text === 'Last prison')).toBeUndefined()
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })

    it('removes values when the lookups find nothing', async () => {
      getPomNameSpy.mockResolvedValue(null)
      getPomToRoHandoverDetailsSpy.mockResolvedValue(null)
      getPrisonSpy.mockResolvedValue(null)

      await expect(
        getThroughcareRows(token, nomsNumber, { ...prisonerInCustody, releaseDate: undefined }),
      ).resolves.toEqual({
        rows: [summaryListRow('Current prison', 'HMP Whatton')],
      })
      await expect(
        getThroughcareRows(token, nomsNumber, { ...prisonerReleased, releaseDate: undefined }),
      ).resolves.toEqual(undefined)
    })

    it('removes the values when the apis respond with a handled 500', async () => {
      const errorResponse = { status: 500, errors: [{ text: 'Currently unavailable.' }] }
      getPomNameSpy.mockResolvedValue(errorResponse as never)
      getPomToRoHandoverDetailsSpy.mockResolvedValue(errorResponse as never)
      getPrisonSpy.mockResolvedValue(errorResponse as never)

      await expect(getThroughcareRows(token, nomsNumber, prisonerInCustody)).resolves.toEqual({
        rows: [summaryListRow('Current prison', 'HMP Whatton'), summaryListRow('Release date', '16 March 2027')],
      })
      await expect(getThroughcareRows(token, nomsNumber, prisonerReleased)).resolves.toEqual({
        rows: [summaryListRow('Release date', '16 March 2025')],
      })
    })

    it('returns undefined without calling the apis when there is no NOMS number', async () => {
      await expect(getThroughcareRows(token, undefined, prisonerInCustody)).resolves.toBeUndefined()

      expect(getPomNameSpy).not.toHaveBeenCalled()
      expect(getPomToRoHandoverDetailsSpy).not.toHaveBeenCalled()
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })
  })
})
