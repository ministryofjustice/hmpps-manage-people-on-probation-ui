import MoicApiClient from '../data/moicApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { SummaryList, SummaryListRow } from '../@types'
import { filterEmptyValues, summaryListRow } from './govukComponents/summaryList'
import { dateWithYear } from './dateWithYear'

export const THROUGHCARE_VARIANTS = {
  IN_CUSTODY: 'IN_CUSTODY',
  RELEASED: 'RELEASED',
} as const

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
): Promise<SummaryList | undefined> {
  if (!nomsNumber) {
    return undefined
  }

  const variant =
    prisoner?.inOutStatus === 'OUT' && prisoner?.status.includes('INACTIVE')
      ? THROUGHCARE_VARIANTS.RELEASED
      : THROUGHCARE_VARIANTS.IN_CUSTODY

  const moicApiClient = new MoicApiClient(token)
  const pomRequest = moicApiClient.getPomDetails(nomsNumber)
  let rows: SummaryListRow[]

  if (variant === THROUGHCARE_VARIANTS.RELEASED) {
    const [pom, lastPrison] = await Promise.all([
      pomRequest,
      prisoner?.lastPrisonId ? new PrisonRegisterApiClient(token).getPrison(prisoner.lastPrisonId) : undefined,
    ])

    rows = filterEmptyValues([
      summaryListRow('Prison offender manager (POM)', swapNameOrder(pom?.primary_pom?.name)),
      summaryListRow('Last prison', lastPrison?.prisonName),
      summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)),
    ])
  }

  if (variant === THROUGHCARE_VARIANTS.IN_CUSTODY) {
    const [pom, handover] = await Promise.all([pomRequest, moicApiClient.getPomToRoHandoverDetails(nomsNumber)])

    rows = filterEmptyValues([
      summaryListRow('Prison offender manager (POM)', swapNameOrder(pom?.primary_pom?.name)),
      summaryListRow('Current prison', prisoner?.prisonName),
      summaryListRow('Responsible officer expected handover date', dateWithYear(handover?.handoverStartDate)),
      summaryListRow('Release date', dateWithYear(prisoner?.releaseDate)),
    ])
  }

  if (rows.length) {
    return { rows }
  }

  return undefined
}
