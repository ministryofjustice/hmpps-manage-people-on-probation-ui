import { AppointmentEnforcementAction } from '../models/Appointments'
import { ActionProps, enforcementActionMap, outcomeMap, OutcomeProps } from '../properties/appointment-outcomes'

type MappedOutcome<T> = [T, OutcomeProps]
type MappedAction = [AppointmentEnforcementAction, ActionProps]

export const getMappedOutcome = <T>({
  code = null,
  description = null,
}: {
  code?: string
  description?: string
} = {}): MappedOutcome<T> | null => {
  if (!code && !description) return null
  const isMatch = (item: OutcomeProps) =>
    code ? item.code === code : item.description.toLowerCase() === description.toLowerCase()
  const mappedOutcome: MappedOutcome<T> | null =
    (Object.entries(outcomeMap).find(([_key, item]) => isMatch(item)) as MappedOutcome<T>) || null
  return mappedOutcome
}

export const getMappedActions = (actionCode: string | string[] = null): MappedAction[] => {
  if (!actionCode) return null
  const actionCodes = Array.isArray(actionCode) ? actionCode : [actionCode]
  const mappedActions: MappedAction[] = Object.entries(enforcementActionMap).filter(([_key, { code: _code }]) =>
    actionCodes.includes(_code),
  ) as MappedAction[]
  if (!mappedActions?.length) {
    return null
  }
  return mappedActions
}
