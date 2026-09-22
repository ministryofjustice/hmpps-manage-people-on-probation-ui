import { DateTime } from 'luxon'
import { Contact } from '../data/model/overdueOutcomes'

export const filterContacts = (outcomes: Contact[], years: number = 2): Contact[] => {
  return outcomes?.filter(contact => {
    const contactDate = DateTime.fromISO(contact.date)
    const yearsAgo = DateTime.now().minus({ years })
    return contactDate >= yearsAgo
  })
}
export const filterContactsMonths = (outcomes: Contact[], months: number = 3): Contact[] => {
  return outcomes?.filter(contact => {
    const contactDate = DateTime.fromISO(contact.date)
    const monthsAgo = DateTime.now().minus({ months })
    return contactDate >= monthsAgo
  })
}
