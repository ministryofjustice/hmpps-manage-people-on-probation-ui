import MoicApiClient from '../data/moicApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { SummaryListRow } from '../@types'
import { replaceEmptyValues, summaryListRow } from './govukComponents/summaryList'
import { dateWithYear } from './dateWithYear'
import { swapNameOrder } from './name'

export const THROUGHCARE_VARIANTS = {
  IN_CUSTODY: 'IN_CUSTODY',
  RELEASED: 'RELEASED',
} as const

const NO_DATA_AVAILABLE = 'No data available'

export interface Throughcare {
  rows?: SummaryListRow[]
  unavailable?: 'some' | 'all'
}

interface ThroughcareRow {
  row: SummaryListRow
  failed: boolean
}

const settle = async <T>(request: Promise<T> | undefined): Promise<{ value: T | null; failed: boolean }> => {
  try {
    const value = await request
    const failed = Boolean(value && typeof value === 'object' && 'errors' in value)
    return { value: failed ? null : (value ?? null), failed }
  } catch {
    return { value: null, failed: true }
  }
}

export async function getThroughcareRows(
  token: string,
  nomsNumber?: string,
  prisoner?: Prisoner,
  prisonerUnavailable = false,
): Promise<Throughcare | undefined> {
  if (!nomsNumber) {
    return undefined
  }

  const variant =
    prisoner?.inOutStatus === 'OUT' && prisoner?.status.includes('INACTIVE')
      ? THROUGHCARE_VARIANTS.RELEASED
      : THROUGHCARE_VARIANTS.IN_CUSTODY

  let rows: ThroughcareRow[]

  const moicApiClient = new MoicApiClient(token)
  const pomRequest = settle(moicApiClient.getPomDetails(nomsNumber))

  if (variant === THROUGHCARE_VARIANTS.RELEASED) {
    const [pom, lastPrison] = await Promise.all([
      pomRequest,
      settle(prisoner?.lastPrisonId ? new PrisonRegisterApiClient(token).getPrison(prisoner.lastPrisonId) : undefined),
    ])

    rows = [
      {
        row: summaryListRow('Prison offender manager (POM)', swapNameOrder(pom.value?.primary_pom?.name)),
        failed: pom.failed,
      },
      { row: summaryListRow('Last prison', lastPrison.value?.prisonName), failed: lastPrison.failed },
      { row: summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)), failed: prisonerUnavailable },
    ]
  }

  if (variant === THROUGHCARE_VARIANTS.IN_CUSTODY) {
    const [pom, handover] = await Promise.all([pomRequest, settle(moicApiClient.getPomToRoHandoverDetails(nomsNumber))])

    rows = [
      {
        row: summaryListRow('Prison offender manager (POM)', swapNameOrder(pom.value?.primary_pom?.name)),
        failed: pom.failed,
      },
      { row: summaryListRow('Current prison', prisoner?.prisonName), failed: prisonerUnavailable },
      {
        row: summaryListRow(
          'Responsible officer expected handover date',
          dateWithYear(handover.value?.handoverStartDate),
        ),
        failed: handover.failed,
      },
      { row: summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)), failed: prisonerUnavailable },
    ]
  }

  const availableRows = replaceEmptyValues(
    rows.filter(({ failed }) => !failed).map(({ row }) => row),
    NO_DATA_AVAILABLE,
  )
  let unavailable: Throughcare['unavailable']
  if (availableRows.length < rows.length) {
    unavailable = availableRows.length ? 'some' : 'all'
  }

  return { rows: availableRows.length ? availableRows : undefined, unavailable }
}
