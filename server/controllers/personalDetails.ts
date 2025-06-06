import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import ArnsApiClient from '../data/arnsApiClient'
import MasApiClient from '../data/masApiClient'
import { DeliusRoleEnum } from '../data/model/deliusRoles'
import TierApiClient from '../data/tierApiClient'
import RoleService from '../services/roleService'
import { toRoshWidget, toPredictors, toIsoDateFromPicker, isValidCrn } from '../utils'
import type { Controller } from '../@types'
import { PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { personDetailsValidation } from '../properties'
import { validateWithSpec } from '../utils/validationUtils'
import { renderError } from '../middleware'

const routes = [
  'getPersonalDetails',
  'postEditDetails',
  'getStaffContacts',
  'getPersonalContact',
  'getPersonalContactNote',
  'getMainAddressNote',
  'getAddresses',
  'getAddressesNote',
  'getDocumentsDownload',
  'getHandoff',
  'getDisabilities',
  'getDisabilitiesNote',
  'getAdjustments',
  'getAdjustmentsNote',
  'getCircumstances',
  'getCircumstancesNote',
] as const

const personalDetailsController: Controller<typeof routes> = {
  getPersonalDetails: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      const success = req.query.update
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      const roleService = new RoleService(masClient)
      const manageUsersAccess = await roleService.hasAccess(DeliusRoleEnum.MANAGE_USERS, res.locals.user.username)
      let action = 'VIEW_MAS_PERSONAL_DETAILS'
      let renderPath = 'pages/personal-details'
      const backLink = req.path.includes('personal-details/') ? `/case/${crn}/personal-details` : null
      const hidePageHeader = req.path.includes('personal-details/')
      if (req.path.includes('personal-details/edit-contact-details')) {
        if (!manageUsersAccess) {
          return res.redirect(`/no-perm-autherror?backLink=${backLink}`)
        }
        action = 'VIEW_EDIT_PERSONAL_DETAILS'
        renderPath = 'pages/edit-contact-details/edit-contact-details'
      }
      if (req.path.includes('personal-details/edit-main-address')) {
        if (!manageUsersAccess) {
          return res.redirect(`/no-perm-autherror?backLink=${backLink}`)
        }
        action = 'VIEW_EDIT_MAIN_ADDRESS'
        renderPath = 'pages/edit-contact-details/edit-main-address'
      }
      await auditService.sendAuditMessage({
        action,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personalDetails, risks, needs, tierCalculation, predictors] = await Promise.all([
        masClient.getPersonalDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getNeeds(crn),
        tierClient.getCalculationDetails(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render(renderPath, {
        personalDetails,
        needs,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
        success,
        backLink,
        hidePageHeader,
        manageUsersAccess,
      })
    }
  },
  postEditDetails: hmppsAuthClient => {
    return async (req, res) => {
      const editingMainAddress = req.path.includes('personal-details/edit-main-address')
      const errorMessages = validateWithSpec(req.body, personDetailsValidation(editingMainAddress))
      res.locals.errorMessages = errorMessages
      const updateFn = editingMainAddress ? 'updatePersonalDetailsAddress' : 'updatePersonalDetailsContact'
      let request: PersonalDetailsUpdateRequest = {
        ...req.body,
      }
      const {
        noFixedAddress,
        buildingName,
        buildingNumber,
        streetName,
        district,
        town,
        county,
        postcode,
        phoneNumber: telephoneNumber,
        mobileNumber,
        emailAddress: email,
        addressTypeCode: typeCode,
        verified,
        startDate: from,
        endDate: to,
        notes,
      } = request
      let action = 'SAVE_EDIT_PERSONAL_DETAILS'
      const renderPage = req.path.split('/').pop()
      if (editingMainAddress) {
        request = {
          ...request,
          startDate: toIsoDateFromPicker(req.body.startDate),
          endDate: toIsoDateFromPicker(req.body.endDate),
          noFixedAddress: noFixedAddress === 'true',
          buildingName,
          buildingNumber,
          streetName,
          district,
          town,
          county,
          postcode,
          verified: verified ? verified === 'true' : null,
        }
        action = 'SAVE_EDIT_MAIN_ADDRESS'
      }
      const warningDisplayed: boolean = !request.endDate || Object.hasOwn(req.body, 'endDateWarningDisplayed')
      const isValid = Object.keys(errorMessages).length === 0 && warningDisplayed
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      if (!isValid) {
        const [personalDetails, risks, needs, tierCalculation, predictors] = await Promise.all([
          masClient.getPersonalDetails(crn),
          arnsClient.getRisks(crn),
          arnsClient.getNeeds(crn),
          tierClient.getCalculationDetails(crn),
          arnsClient.getPredictorsAll(crn),
        ])
        const risksWidget = toRoshWidget(risks)
        const predictorScores = toPredictors(predictors)
        let personalDetailsData = { ...personalDetails }
        if (editingMainAddress) {
          personalDetailsData = {
            ...personalDetailsData,
            mainAddress: {
              ...personalDetailsData.mainAddress,
              noFixedAddress: request.noFixedAddress,
              buildingName,
              buildingNumber,
              streetName,
              district,
              town,
              county,
              postcode,
              typeCode,
              verified: request.verified,
              from,
              to,
              notes,
            },
          }
        } else {
          personalDetailsData = {
            ...personalDetails,
            telephoneNumber,
            mobileNumber,
            email,
          }
        }
        res.render(`pages/edit-contact-details/${renderPage}`, {
          personalDetails: personalDetailsData,
          needs,
          tierCalculation,
          crn,
          risksWidget,
          predictorScores,
          hidePageHeader: true,
          backLink: `/case/${crn}/personal-details`,
        })
      } else {
        await masClient[updateFn](crn, Object.fromEntries(Object.entries(request).filter(([key]) => key !== '_csrf')))
        if (!isValidCrn(crn)) {
          renderError(404)(req, res)
        }
        res.redirect(`/case/${crn}/personal-details?update=success`)
      }
    }
  },
  getStaffContacts: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_SENTENCE_PROFESSIONAL_CONTACTS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const masClient = new MasApiClient(token)
      const professionalContact = await masClient.getContacts(crn)
      const { previousContacts } = professionalContact
      const { currentContacts } = professionalContact
      const isSentenceJourney = req.url.split('/').includes('sentence')
      return res.render('pages/staff-contacts', {
        professionalContact,
        previousContacts,
        currentContacts,
        isSentenceJourney,
        crn,
      })
    }
  },
  getPersonalContact: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_CONTACT',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personalContact, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getPersonalContact(crn, id),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/personal-details/contact', {
        personalContact,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
  getPersonalContactNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_CONTACT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personalContact, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getPersonalContactNote(crn, id, noteId),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/personal-details/contact/contact-note', {
        personalContact,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
  getMainAddressNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_PERSONAL_CONTACT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [personalDetails, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getMainAddressNote(crn, noteId),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      res.render('pages/personal-details/main-address/address-note', {
        personalDetails,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
  getAddresses: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_VIEW_ALL_ADDRESSES',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const addressOverview = await masClient.getPersonalAddresses(crn)
      return res.render('pages/personal-details/addresses', {
        addressOverview,
        crn,
      })
    }
  },
  getAddressesNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, addressId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_VIEW_ALL_ADDRESSES_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const [addressOverview, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getPersonalAddressesNote(crn, addressId, noteId),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const risksWidget = toRoshWidget(risks)
      const predictorScores = toPredictors(predictors)
      return res.render('pages/personal-details/addresses/address-note', {
        addressOverview,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
      })
    }
  },
  getDocumentsDownload: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { documentId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_DOWNLOAD_DOCUMENT',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const response = await masClient.downloadDocument(crn, documentId)
      res.set(response.headers)
      res.send(response.body)
    }
  },
  getHandoff: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const { system } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: `VIEW_MAS_HANDOFF_${system.toUpperCase()}`,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const personSummary = await masClient.getPersonSummary(crn)
      return res.render(`pages/handoff/${system}`, {
        personSummary,
        crn,
      })
    }
  },
  getDisabilities: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: `VIEW_MAS_DISABILITIES`,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const disabilities = await masClient.getPersonDisabilities(crn)
      return res.render(`pages/personal-details/disabilities`, {
        disabilities,
        crn,
      })
    }
  },
  getDisabilitiesNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, disabilityId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: `VIEW_MAS_DISABILITY_NOTE`,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const disabilityOverview = await masClient.getPersonDisabilityNote(crn, disabilityId, noteId)
      return res.render(`pages/personal-details/disabilities/disability-note`, {
        disabilityOverview,
        crn,
      })
    }
  },
  getAdjustments: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: `VIEW_MAS_ADJUSTMENTS`,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const adjustments = await masClient.getPersonAdjustments(crn)
      return res.render(`pages/personal-details/adjustments`, {
        adjustments,
        crn,
      })
    }
  },
  getAdjustmentsNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, adjustmentId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_VIEW_ALL_ADJUSTMENT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const adjustmentOverview = await masClient.getPersonAdjustmentNote(crn, adjustmentId, noteId)
      return res.render('pages/personal-details/adjustments/adjustment-note', {
        adjustmentOverview,
        crn,
      })
    }
  },
  getCircumstances: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: `VIEW_MAS_CIRCUMSTANCES`,
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const circumstances = await masClient.getPersonCircumstances(crn)
      return res.render(`pages/personal-details/circumstances`, {
        circumstances,
        crn,
      })
    }
  },
  getCircumstancesNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, circumstanceId, noteId } = req.params
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_VIEW_ALL_CIRCUMSTANCE_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const circumstanceOverview = await masClient.getPersonCircumstanceNote(crn, circumstanceId, noteId)
      res.render('pages/personal-details/circumstances/circumstance-note', {
        circumstanceOverview,
        crn,
      })
    }
  },
}

export default personalDetailsController
