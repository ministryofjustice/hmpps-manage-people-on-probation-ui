import type { ContactEnforcementAction, ContactOutcome } from '../data/model/schedule'

export const getContactEnforcementActions = (contactOutcomes: ContactOutcome[] = []): ContactEnforcementAction[] => {
  return contactOutcomes.reduce((acc, outcome) => {
    if (outcome?.enforcementActions?.length) {
      return [...acc, ...outcome.enforcementActions]
    }
    return acc
  }, [])
}
