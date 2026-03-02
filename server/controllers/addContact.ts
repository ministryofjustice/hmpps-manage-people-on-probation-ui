import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../@types'
import { getSentences, getFrequentContactTypes } from '../middleware'
import { deliusDeepLinkUrl } from '../utils'
import { slugify } from '../utils/slugify'

const routes = [
  'getFrequentlyUsedContact',
  'getAddContactType',
  'postFrequentlyUsedContact',
  'postAddContactType',
  'getAlertResponsibleOfficer',
] as const

const addContactController: Controller<typeof routes, void> = {
  getFrequentlyUsedContact: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const { back } = req.query
      let { url } = req
      url = encodeURIComponent(url)

      return res.render('pages/contacts/add-frequently-used-contact', {
        crn,
        radioItems: res.locals.radioItems,
        url,
        back,
        sentences: getSentences(hmppsAuthClient),
        csrfToken: res.locals.csrfToken,
        ndeliusDeepLinkUrl: deliusDeepLinkUrl('ContactList', crn),
        contactLogUrl: `/case/${crn}/activity-log/`,
      })
    }
  },

  postFrequentlyUsedContact: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { contactType } = req.body

      if (contactType === 'APPOINTMENT') {
        const uuid = uuidv4()
        return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
      }

      if (contactType === 'NDELIUS') {
        return res.redirect(`/case/${crn}/activity-log`)
      }

      const contactTypes = await getFrequentContactTypes(req, res, hmppsAuthClient)
      const selected = contactTypes.find((c: any) => c.code === contactType)
      const slug = selected ? slugify(selected.description) : contactType

      return res.redirect(`/case/${crn}/contacts/add-${slug}`)
    }
  },

  getAddContactType: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactType } = req.params
      const { back } = req.query

      const response = await getFrequentContactTypes(req, res, hmppsAuthClient)
      const contactTypes = Array.isArray(response) ? response : (response as any).contactTypes || []

      const selectedType = contactTypes.find((c: any) => slugify(c.description) === contactType)

      return res.render('pages/contacts/add-contact-type', {
        crn,
        contactTypeName: selectedType?.description || 'Contact',
        back,
        csrfToken: res.locals.csrfToken,
        formValues: {},
      })
    }
  },

  postAddContactType: () => {
    return async (req, res) => {
      const { crn } = req.params
      // TODO: Call API endpoint when available
      // ?success=true&message=Contact added successfully.
      return res.redirect(`/case/${crn}/contacts/alert-responsible-officer`)
    }
  },

  getAlertResponsibleOfficer: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactType } = req.params
      const { back } = req.query

      return res.render('pages/contacts/alert-responsible-officer', {
        crn,
        back,
        csrfToken: res.locals.csrfToken,
        formValues: {},
      })
    }
  },
}

export default addContactController
