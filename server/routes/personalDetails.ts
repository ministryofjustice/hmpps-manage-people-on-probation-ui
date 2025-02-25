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
import type { PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { validateWithSpec } from '../utils/validationUtils'
import { personDetailsValidation } from '../properties'
import renders from '../controllers/renders'

export default function personalDetailRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get(
    [
      '/case/:crn/personal-details',
      '/case/:crn/personal-details/edit-contact-details',
      '/case/:crn/personal-details/edit-main-address',
    ],
    async (req, res, _next) => {
      const { crn } = req.params
      const success = req.query.update
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const tierClient = new TierApiClient(token)

      let action = 'VIEW_MAS_PERSONAL_DETAILS'
      let renderPath = 'pages/personal-details'
      const backLink = req.path.includes('personal-details/') ? `/case/${crn}/personal-details` : null
      const hidePageHeader = req.path.includes('personal-details/')
      if (req.path.includes('personal-details/edit-contact-details')) {
        action = 'VIEW_EDIT_PERSONAL_DETAILS'
        renderPath = 'pages/edit-contact-details/edit-contact-details'
      }
      if (req.path.includes('personal-details/edit-main-address')) {
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
      res.render(renderPath, {
        personalDetails,
        needs,
        tierCalculation,
        crn,
        risksWidget,
        predictorScores,
        success,
        backLink,
        hidePageHeader,
      })
    },
  )

  post(
    ['/case/:crn/personal-details/edit-contact-details', '/case/:crn/personal-details/edit-main-address'],
    async (req, res, _next) => {
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
          endDate: toIsoDateFromPicker(req.body.endDate),
          startDate: toIsoDateFromPicker(req.body.startDate),
          noFixedAddress: req?.body?.noFixedAddress === 'true',
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

      const warningDisplayed: boolean =
        !request.endDate || Object.prototype.hasOwnProperty.call(req.body, 'endDateWarningDisplayed')
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
              noFixedAddress,
              buildingName,
              buildingNumber,
              streetName,
              district,
              town,
              county,
              postcode,
              typeCode,
              verified,
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
        res.redirect(`/case/${crn}/personal-details?update=success`)
      }
    },
  )

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

  get('/case/:crn/personal-details/adjustments/:adjustmentId/note/:noteId', async (req, res, _next) => {
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

    res.render('pages/personal-details/adjustments/adjustment-note', {
      adjustmentOverview,
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
