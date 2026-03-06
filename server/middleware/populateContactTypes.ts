import { HmppsAuthClient } from '../data'
import { getFrequentContactTypes } from './getFrequentlyUsedContactTypes'
import { Route } from '../@types'

export const populateContactTypes = (hmppsAuthClient: HmppsAuthClient): Route<void> => {
  return async (req, res, next) => {
    try {
      // Fetch the raw contact types
      const contactTypes = await getFrequentContactTypes(req, res, hmppsAuthClient)

      // Build the radio items
      const radioItems: any[] = [
        {
          value: 'APPOINTMENT',
          text: 'An appointment',
          checked: req.body?.contactType === 'APPOINTMENT',
        },
      ]

      radioItems.push(
        ...contactTypes.map((contact: any) => ({
          value: contact.code,
          text: contact.description,
          checked: req.body?.contactType === contact.code,
        })),
      )

      radioItems.push({
        divider: 'or',
      })

      radioItems.push({
        value: 'NDELIUS',
        text: 'I want to add a different contact (opens NDelius in a new tab)',
        checked: req.body?.contactType === 'NDELIUS',
      })

      res.locals.contactTypes = contactTypes
      res.locals.radioItems = radioItems

      next()
    } catch (error) {
      next(error)
    }
  }
}
