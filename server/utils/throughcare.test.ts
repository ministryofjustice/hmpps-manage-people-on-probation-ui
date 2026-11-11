import MoicApiClient from '../data/moicApiClient'
import PrisonRegisterApiClient, { Prison } from '../data/prisonRegisterApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { getThroughcareRows } from './throughcare'

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

const getPomDetailsSpy = jest.spyOn(MoicApiClient.prototype, 'getPomDetails')
const getPomToRoHandoverDetailsSpy = jest.spyOn(MoicApiClient.prototype, 'getPomToRoHandoverDetails')
const getPrisonSpy = jest.spyOn(PrisonRegisterApiClient.prototype, 'getPrison')

describe('utils/throughcare', () => {
  beforeEach(() => {
    getPomDetailsSpy.mockResolvedValue({ primary_pom: { staff_id: 1, name: 'Dove, Rachel' } })
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
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'Rachel Dove' } },
          { key: { text: 'Current prison' }, value: { text: 'HMP Whatton' } },
          { key: { text: 'Responsible officer expected handover date' }, value: { text: '6 November 2026' } },
          { key: { text: 'Release date' }, value: { text: '16 March 2027' } },
        ],
      })

      expect(MoicApiClient).toHaveBeenCalledWith(token)
      expect(getPomDetailsSpy).toHaveBeenCalledWith(nomsNumber)
      expect(getPomToRoHandoverDetailsSpy).toHaveBeenCalledWith(nomsNumber)
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })

    it('returns the released rows', async () => {
      await expect(getThroughcareRows(token, nomsNumber, prisonerReleased)).resolves.toEqual({
        rows: [
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'Rachel Dove' } },
          { key: { text: 'Last prison' }, value: { text: 'Moorland (HMP & YOI)' } },
          { key: { text: 'Release date' }, value: { text: '16 March 2025' } },
        ],
      })

      expect(PrisonRegisterApiClient).toHaveBeenCalledWith(token)
      expect(getPomDetailsSpy).toHaveBeenCalledWith(nomsNumber)
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

      expect(throughcare.rows.find(row => row.key.text === 'Last prison').value.text).toEqual('No data available')
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })

    it('renders a default value when the lookups find nothing', async () => {
      getPomDetailsSpy.mockResolvedValue(null)
      getPomToRoHandoverDetailsSpy.mockResolvedValue(null)
      getPrisonSpy.mockResolvedValue(null)

      await expect(
        getThroughcareRows(token, nomsNumber, { ...prisonerInCustody, releaseDate: undefined }),
      ).resolves.toEqual({
        rows: [
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'No data available' } },
          { key: { text: 'Current prison' }, value: { text: 'HMP Whatton' } },
          { key: { text: 'Responsible officer expected handover date' }, value: { text: 'No data available' } },
          { key: { text: 'Release date' }, value: { text: 'No data available' } },
        ],
      })
      await expect(
        getThroughcareRows(token, nomsNumber, { ...prisonerReleased, releaseDate: undefined }),
      ).resolves.toEqual({
        rows: [
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'No data available' } },
          { key: { text: 'Last prison' }, value: { text: 'No data available' } },
          { key: { text: 'Release date' }, value: { text: 'No data available' } },
        ],
      })
    })

    it('renders a default value when the apis respond with a handled 500', async () => {
      const errorResponse = { status: 500, errors: [{ text: 'Currently unavailable.' }] }
      getPomDetailsSpy.mockResolvedValue(errorResponse as never)
      getPomToRoHandoverDetailsSpy.mockResolvedValue(errorResponse as never)
      getPrisonSpy.mockResolvedValue(errorResponse as never)

      await expect(getThroughcareRows(token, nomsNumber, prisonerInCustody)).resolves.toEqual({
        rows: [
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'No data available' } },
          { key: { text: 'Current prison' }, value: { text: 'HMP Whatton' } },
          { key: { text: 'Responsible officer expected handover date' }, value: { text: 'No data available' } },
          { key: { text: 'Release date' }, value: { text: '16 March 2027' } },
        ],
      })
      await expect(getThroughcareRows(token, nomsNumber, prisonerReleased)).resolves.toEqual({
        rows: [
          { key: { text: 'Prison offender manager (POM)' }, value: { text: 'No data available' } },
          { key: { text: 'Last prison' }, value: { text: 'No data available' } },
          { key: { text: 'Release date' }, value: { text: '16 March 2025' } },
        ],
      })
    })

    it('returns undefined without calling the apis when there is no NOMS number', async () => {
      await expect(getThroughcareRows(token, undefined, prisonerInCustody)).resolves.toBeUndefined()

      expect(getPomDetailsSpy).not.toHaveBeenCalled()
      expect(getPomToRoHandoverDetailsSpy).not.toHaveBeenCalled()
      expect(getPrisonSpy).not.toHaveBeenCalled()
    })
  })
})
