import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../@types'
import { getSentences, getFrequentContactTypes } from '../middleware'
import { deliusDeepLinkUrl } from '../utils'
import { slugify } from '../utils/slugify'
import { isResponsibleOfficer } from '../middleware/isResponsibleOfficer'
import ContactService from '../services/contactService'
import MasApiClient from '../data/masApiClient'

const routes = [
  'getFrequentlyUsedContact',
  'getAddContactType',
  'postFrequentlyUsedContact',
  'postAddContactType',
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
      const isVisor: boolean = req.session.data?.risks[crn]?.riskFlags
        .map(risk => risk.description.toLowerCase())
        .includes('visor')
      const showVisor: string = isVisor ? 'SHOW_VISOR' : ''

      const responsibleOfficer: boolean = await isResponsibleOfficer(hmppsAuthClient)(req, res)
      const showResponsibleOfficer: string = !responsibleOfficer ? 'SHOW_OFFICER' : ''

      const selectedType = contactTypes.find((c: any) => slugify(c.description) === contactType)

      return res.render('pages/contacts/add-contact-type', {
        crn,
        contactTypeName: selectedType?.description || 'Contact',
        back,
        csrfToken: res.locals.csrfToken,
        formValues: {},
        isVisor: showVisor,
        responsibleOfficer: showResponsibleOfficer,
      })
    }
  },

  postAddContactType: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const contactService = new ContactService(masClient)
      //  const responsibleOfficer: boolean = await isResponsibleOfficer(hmppsAuthClient)(req, res)

      // TODO: Call API endpoint when available
      // ?success=true&message=Contact added successfully.
      // TODO: Add below on success of API success
      const successQueryParam = `?showSuccessBanner=true`
      return res.redirect(`/case/${crn}/activity-log${successQueryParam}`)
    }
  },
}

export default addContactController
