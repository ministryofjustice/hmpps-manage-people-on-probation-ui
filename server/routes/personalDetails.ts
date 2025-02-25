import type { Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import type { Route } from '../@types'
import { toIsoDateFromPicker, toPredictors, toRoshWidget } from '../utils/utils'
import { PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { validateWithSpec } from '../utils/validationUtils'
import { personDetailsValidation } from '../properties'
import renders from '../controllers/renders'

export default function personalDetailRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get(['/case/:crn/personal-details', '/case/:crn/personal-details/edit-contact-details'], async (req, res, _next) => {
    const { crn } = req.params
    const success = req.query.update
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const arnsClient = new ArnsApiClient(token)
    const tierClient = new TierApiClient(token)

    const edit = req.path.includes('edit-contact-details') === true

    await auditService.sendAuditMessage({
      action: edit ? 'VIEW_EDIT_PERSONAL_DETAILS' : 'VIEW_MAS_PERSONAL_DETAILS',
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
    res.render(edit ? 'pages/edit-contact-details/edit-contact-details' : 'pages/personal-details', {
      personalDetails,
      needs,
      tierCalculation,
      crn,
      risksWidget,
      predictorScores,
      success,
      backLink: edit ? `/case/${crn}/personal-details` : undefined,
    })
  })

  post('/case/:crn/personal-details/edit-contact-details', async (req, res, _next) => {
    const errorMessages = validateWithSpec(req.body, personDetailsValidation)
    res.locals.errorMessages = errorMessages

    const request: PersonalDetailsUpdateRequest = {
      ...req.body,
      endDate: toIsoDateFromPicker(req.body.endDate),
      startDate: toIsoDateFromPicker(req.body.startDate),
      noFixedAddress: req.body.noFixedAddress === 'true',
      verified: req.body.verified ? req.body.verified === 'true' : null,
    }

    const warningDisplayed: boolean =
      !request.endDate || Object.prototype.hasOwnProperty.call(req.body, 'endDateWarningDisplayed')
    const isValid = Object.keys(errorMessages).length === 0 && warningDisplayed
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const arnsClient = new ArnsApiClient(token)
    const tierClient = new TierApiClient(token)
    await auditService.sendAuditMessage({
      action: 'SAVE_EDIT_PERSONAL_DETAILS',
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
      const mainAddress = { ...personalDetails.mainAddress }
      personalDetails.telephoneNumber = request.phoneNumber
      personalDetails.mobileNumber = request.mobileNumber
      personalDetails.email = request.emailAddress
      mainAddress.noFixedAddress = request.noFixedAddress
      mainAddress.buildingName = request.buildingName
      mainAddress.buildingNumber = request.buildingNumber
      mainAddress.streetName = request.streetName
      mainAddress.district = request.district
      mainAddress.town = request.town
      mainAddress.county = request.county
      mainAddress.postcode = request.postcode
      mainAddress.typeCode = request.addressTypeCode
      mainAddress.verified = request.verified
      mainAddress.from = request.startDate
      mainAddress.to = request.endDate
      mainAddress.notes = request.notes
      personalDetails.mainAddress = mainAddress

      res.render('pages/edit-contact-details/edit-contact-details', {
        personalDetails,
        needs,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
        backLink: `/case/${crn}/personal-details`,
      })
    } else {
      await masClient.updatePersonalDetails(crn, request)
      res.redirect(`/case/${crn}/personal-details?update=success`)
    }
  })
  get('/case/:crn/personal-details/staff-contacts', renders.staffContacts(hmppsAuthClient))

  get('/case/:crn/personal-details/personal-contact/:id', async (req, res, _next) => {
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
    res.render('pages/personal-details/contact', {
      personalContact,
      tierCalculation,
      crn,
      risksWidget,
      predictorScores,
    })
  })

  get('/case/:crn/personal-details/personal-contact/:id/note/:noteId', async (req, res, _next) => {
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
    res.render('pages/personal-details/contact/contact-note', {
      personalContact,
      tierCalculation,
      crn,
      risksWidget,
      predictorScores,
    })
  })

  get('/case/:crn/personal-details/main-address/note/:noteId', async (req, res, _next) => {
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
  })

  get('/case/:crn/personal-details/addresses', async (req, res, _next) => {
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
    res.render('pages/personal-details/addresses', {
      addressOverview,
      crn,
    })
  })

  get('/case/:crn/personal-details/addresses/:addressId/note/:noteId', async (req, res, _next) => {
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
    res.render('pages/personal-details/addresses/address-note', {
      addressOverview,
      tierCalculation,
      crn,
      risksWidget,
      predictorScores,
    })
  })

  get('/case/:crn/personal-details/documents/:documentId/download', async (req, res, _next) => {
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
  })

  get('/case/:crn/handoff/:system', async (req, res, _next) => {
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
    res.render(`pages/handoff/${system}`, {
      personSummary,
      crn,
    })
  })

  get('/case/:crn/personal-details/disabilities', async (req, res, _next) => {
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
    res.render(`pages/personal-details/disabilities`, {
      disabilities,
      crn,
    })
  })

  get('/case/:crn/personal-details/disability/:disabilityId/note/:noteId', async (req, res, _next) => {
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
    res.render(`pages/personal-details/disabilities/disability-note`, {
      disabilityOverview,
      crn,
    })
  })

  get('/case/:crn/personal-details/adjustments', async (req, res, _next) => {
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
    res.render(`pages/personal-details/adjustments`, {
      adjustments,
      crn,
    })
  })

  get('/case/:crn/personal-details/circumstances', async (req, res, _next) => {
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
    res.render(`pages/personal-details/circumstances`, {
      circumstances,
      crn,
    })
  })

  get('/case/:crn/personal-details/circumstances/:circumstanceId/note/:noteId', async (req, res, _next) => {
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
  })
}
