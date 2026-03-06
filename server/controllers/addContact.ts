import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../@types'
import { getSentences, getFrequentContactTypes, renderError } from '../middleware'
import { deliusDeepLinkUrl } from '../utils'
import { slugify } from '../utils/slugify'
import { formattedDate } from '../utils/formattedDate'
import { isResponsibleOfficer } from '../middleware/isResponsibleOfficer'
import ContactService from '../services/contactService'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'
import { CreateContactRequest, CreateContactResponse } from '../data/model/contacts'

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
      // Show error page if no contacts types returned
      if (res.locals.radioItems.length === 3) {
        return renderError(500)(req, res)
      }
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
      const showVisor: string | undefined = isVisor ? 'SHOW_VISOR' : undefined

      const responsibleOfficer: boolean = await isResponsibleOfficer(hmppsAuthClient)(req, res)
      const showResponsibleOfficer: string | undefined = !responsibleOfficer ? 'SHOW_OFFICER' : undefined

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
      const { crn, contactType: slug } = req.params
      const { sentence, title, details, sensitivity, visor, alertResponsibleOfficer, date, time } = req.body

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const contactService = new ContactService(masClient)

      const contactTypes = await getFrequentContactTypes(req, res, hmppsAuthClient)
      const selectedType = contactTypes.find(c => slugify(c.description) === slug)

      const payload: CreateContactRequest = {
        date: formattedDate(date),
        time,
        staffCode: 'N03AB01',
        teamCode: 'N03AAT',
        type: selectedType?.code || slug,
        eventId: sentence,
        requirementId: null, // It is not required for this journey, It is optional field
        description: title || undefined,
        notes: details || '',
        alert: alertResponsibleOfficer === 'Yes',
        sensitive: sensitivity === 'Yes',
        visorReport: visor === 'Yes',
      }
      console.log('payload:', payload)
      const response: CreateContactResponse = await contactService.createContact(crn, payload)
      console.log(response.id)

      const file = req.file as Express.Multer.File
      if (file) {
        const patchResponse = await masClient.patchDocuments(crn, response.id.toString(), file)
        if (isSuccessfulUpload(patchResponse)) {
          return res.render('pages/contacts/error-uploading-file', {
            uploadError: 'File not uploaded. Please try again.',
            patchResponse,
          })
        }
      }

      // TODO: Add below on success of API success
      const successQueryParam = `?showSuccessBanner=true`
      return res.redirect(`/case/${crn}/activity-log${successQueryParam}`)
    }
  },
}

export default addContactController
