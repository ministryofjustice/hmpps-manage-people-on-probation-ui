import MoicApiClient from '../data/moicApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { SummaryListRow } from '../@types'
import { replaceEmptyValues, summaryListRow } from './govukComponents/summaryList'
import { dateWithYear } from './dateWithYear'

export const THROUGHCARE_VARIANTS = {
  IN_CUSTODY: 'IN_CUSTODY',
  RELEASED: 'RELEASED',
} as const

const NO_DATA_AVAILABLE = 'No data available'

const swapNameOrder = (name: string = '') =>
  name
    .split(',')
    .map(n => n.trim())
    .reverse()
    .join(' ')

export async function getThroughcareRows(
  token: string,
  nomsNumber?: string,
  prisoner?: Prisoner,
): Promise<SummaryListRow[] | undefined> {
  if (!nomsNumber) {
    return undefined
  }

  const variant =
    prisoner?.inOutStatus === 'OUT' && prisoner?.status.includes('INACTIVE')
      ? THROUGHCARE_VARIANTS.RELEASED
      : THROUGHCARE_VARIANTS.IN_CUSTODY

  let rows: SummaryListRow[]

  const moicApiClient = new MoicApiClient(token)
  const pomRequest = moicApiClient.getPomDetails(nomsNumber)

  if (variant === THROUGHCARE_VARIANTS.RELEASED) {
    const [pom, lastPrison] = await Promise.all([
      pomRequest,
      prisoner?.lastPrisonId ? new PrisonRegisterApiClient(token).getPrison(prisoner.lastPrisonId) : undefined,
    ])

    rows = replaceEmptyValues(
      [
        summaryListRow('Prison offender manager (POM)', swapNameOrder(pom?.primary_pom?.name)),
        summaryListRow('Last prison', lastPrison?.prisonName),
        summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)),
      ],
      NO_DATA_AVAILABLE,
    )
  }

  if (variant === THROUGHCARE_VARIANTS.IN_CUSTODY) {
    const [pom, handover] = await Promise.all([pomRequest, moicApiClient.getPomToRoHandoverDetails(nomsNumber)])

    rows = replaceEmptyValues(
      [
        summaryListRow('Prison offender manager (POM)', swapNameOrder(pom?.primary_pom?.name)),
        summaryListRow('Current prison', prisoner?.prisonName),
        summaryListRow('Responsible officer expected handover date', dateWithYear(handover?.handoverStartDate)),
        summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)),
      ],
      NO_DATA_AVAILABLE,
    )
  }

  return rows.length ? rows : undefined
}
