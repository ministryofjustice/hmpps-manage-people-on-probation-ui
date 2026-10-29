import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { AppointmentOutcomeProps, AppointmentOutcomeSentence, AppResponse } from '../../../models/Locals'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { Name } from '../../../data/model/personalDetails'
import { TierCalculation } from '../../../data/tierApiClient'

const crn = 'X000001'
const contactId = '1234'
const forename = 'James'
const error = 'Select whether or not the appointment note contains sensitive information'

const errorMessages: Record<string, string> = {
  [`appointments-${crn}-${contactId}-sensitivity`]: error,
}

const riskData: RiskData = { assessments: [], httpStatus: 200 }

const appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>> = {
  crn,
  id: contactId,
  uuid: undefined,
  contactId,
  forename,
  appointment: {} as Activity,
  documents: [],
  isValidParams: true,
  isInPast: true,
  reqUrl: '',
  baseUrl: '',
  baseOutcomeUrl: `/case/${crn}/appointments/appointment/${contactId}/outcome/acceptable-absence`,
  completedUrl: '',
  appointmentSession: {
    sensitivityLocked: false,
  },
  isProbationPractitioner: false,
  sendBreachOrRecallLetter: false,
  sendLetter: false,
  showLetterTypeOptions: false,
  otherAction: false,
  sentence: {} as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
  breachOrRecallWarning: null,
  ticket: null,
}

type TestModel = {
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  personAppointment: Partial<PersonAppointment>
  headerPersonName: Name
  headerCRN: string
  headerDob: string
  headerTierLink: string
  tierCalculation: Partial<TierCalculation>
  riskData: RiskData
  errorMessages?: Record<string, string>
  flags: Record<string, boolean>
  body: Record<string, string>
  validMimeTypes: string[]
  maxFileSize: number
  fileUploadLimit: number
  uploadedFiles: string[]
  maxCharCount: number
}

const baseModel: TestModel = {
  appointmentOutcome,
  personAppointment: { appointment: {} as Activity },
  headerPersonName: { forename, surname: 'Morrison' },
  headerCRN: crn,
  headerDob: '1974-10-19',
  headerTierLink: 'http://tier/link',
  riskData,
  tierCalculation: { tierScore: 'C' },
  flags: { enablePersonHeader: true },
  body: { sensitivity: '' },
  validMimeTypes: [],
  maxFileSize: 0,
  fileUploadLimit: 5,
  uploadedFiles: [],
  maxCharCount: 12000,
}

const render = (model = {} as Partial<TestModel>, session = {}) => {
  const input = {
    ...baseModel,
    ...model,
    appointmentOutcome: { ...baseModel.appointmentOutcome, ...model.appointmentOutcome },
  }
  const req = httpMocks.createRequest({
    params: { crn, id: contactId, contactId },
    session: { data: { appointments: { [crn]: { [contactId]: session } } } },
  })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/add-note.njk', input))
}

describe('Add note', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('main').find('.person-header').length).toBe(1)
    expect($('.govuk-back-link').attr('href')).toBe(appointmentOutcome.backLink)
    expect($('[data-qa=pageHeading]').text().trim()).toBe(`Add a note`)
    expect($('main').find('form').find('p').eq(0).text().trim()).toBe(
      'Use paragraphs and formatting to make your notes easy to read. You may want to record notes in the CRISS format.',
    )
    const selectNoteFormat = $('main').find('form').find('.govuk-form-group').eq(0)
    const selectNoteFormatRadioItems = selectNoteFormat.find('.govuk-radios__item')
    expect(selectNoteFormat.find('legend').text().trim()).toBe('Select note format')
    expect(selectNoteFormatRadioItems.length).toBe(2)
    expect(selectNoteFormatRadioItems.eq(0).find('label').text().trim()).toBe('Single text box')
    expect(selectNoteFormatRadioItems.eq(0).find('input:checked').length).toBe(1)
    expect(selectNoteFormatRadioItems.eq(1).find('label').text().trim()).toBe('CRISS sections')
    expect(selectNoteFormatRadioItems.eq(1).find('input:checked').length).toBe(0)
    const helpUsingCRISS = $('main').find('.govuk-details')
    expect(helpUsingCRISS.length).toBe(1)
    expect(helpUsingCRISS.attr('open')).toBeUndefined()
    expect(helpUsingCRISS.find('summary').length).toBe(1)
    expect(helpUsingCRISS.find('.govuk-details__summary-text').text().trim()).toBe('Help using CRISS')
    expect(helpUsingCRISS.find('.govuk-details__text').text().trim()).toContain('CRISS stands for:')
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').length).toBe(5)
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').eq(0).text().trim()).toBe(
      'Check in with the person on probation',
    )
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').eq(1).text().trim()).toBe(
      'Review their progress from the last session',
    )
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').eq(2).text().trim()).toBe(
      'Intervention - target their criminogenic needs and risk',
    )
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').eq(3).text().trim()).toBe(
      'Summarise what you discussed in this session',
    )
    expect(helpUsingCRISS.find('.govuk-details__text').find('li').eq(4).text().trim()).toBe(
      'Set tasks to review in the next session',
    )
    expect($('main').find('.guidance-panel').length).toBe(0)
    expect($('main').find('[data-qa=previousNotes]').length).toBe(0)
    const fileOrNote = $('main').find('[data-qa=fileOrNote]')
    expect(fileOrNote.find('.govuk-character-count label').text().trim()).toBe('Note')
    expect(fileOrNote.find('textarea').val()).toBe('')
    expect(fileOrNote.find('.govuk-drop-zone').length).toBe(1)
    expect(fileOrNote.find('label[for=fileUpload]').text().trim()).toBe('Upload a file (optional)')
    expect(fileOrNote.find(`#appointments-${crn}-${contactId}-notes-info`).text().trim()).toBe(
      'You can enter up to 12000 characters',
    )
    const sensitiveInfo = $('main').find('[data-qa=sensitiveInformation]')
    const sensitiveInfoRadioItems = sensitiveInfo.find('.govuk-radios__item')
    expect(sensitiveInfo.find('legend').text().trim()).toBe('Does this contact include sensitive information?')
    expect(sensitiveInfo.find('.govuk-hint').text().trim()).toBe(
      'This is information that you believe must be recorded but not shared with a person on probation. If they make a request for their record, the Data Protection Team will decide whether the information can be shared.',
    )
    const expectedLabels = ['Yes, it includes sensitive information', 'No, it is not sensitive']

    expect(sensitiveInfoRadioItems.length).toBe(2)
    sensitiveInfoRadioItems.each((i, radioItem) => {
      expect($(radioItem).find('label').text().trim()).toBe(expectedLabels[i])
      expect($(radioItem).find('input:checked').length).toBe(0)
    })
    expect($('main').find('button').text().trim()).toBe('Continue')
  })

  it('should display the prepended text', () => {
    const $ = render({ appointmentOutcome: { ...appointmentOutcome, notePrepend: 'prepend text' } })
    expect($('main').find('.guidance-panel').text()).toContain('prepend text')
  })

  it('should display previous notes', () => {
    const $ = render({
      personAppointment: {
        appointment: {
          id: '1',
          startDateTime: '',
          type: '',
          appointmentNotes: [{ id: 1, note: 'Some previous notes' }],
        },
      },
    })
    const previousNotes = $('main').find('[data-qa=previousNotes]')
    expect(previousNotes.find('h3').text().trim()).toBe('Previous notes')
    expect(previousNotes.text()).toContain('Some previous notes')
  })

  it('should not display the upload file if not manage appointment', () => {
    const $ = render({ appointmentOutcome: { ...appointmentOutcome, contactId: undefined } })
    const fileOrNote = $('main').find('[data-qa=fileOrNote]')
    expect(fileOrNote.find('.govuk-drop-zone').length).toBe(0)
  })

  it('should display the validation error when no sensitivity option is selected', () => {
    const $ = render({ errorMessages })
    const summary = $('.govuk-error-summary')
    expect(summary.find('h2').text().trim()).toEqual('There is a problem')
    expect(summary.find('li').length).toBe(1)
    expect(summary.find('li a').attr('href')).toBe(`#appointments-${crn}-${contactId}-sensitivity`)
    expect(summary.find('li a').text().trim()).toBe(error)
    expect($('form > .govuk-form-group').hasClass('govuk-form-group--error')).toBe(true)
    expect($('form').find('.govuk-error-message').text().trim()).toContain(error)
  })

  it('should not display the sensitivity question if sensitivity is locked', () => {
    const $ = render({ appointmentOutcome: { appointmentSession: { sensitivityLocked: true } } })
    expect($('[data-qa=sensitiveInformation]').length).toBe(0)
  })

  it('should persist the sensitivity selection', () => {
    const $ = render({ body: { sensitivity: 'Yes' } })
    const sensitiveInfoRadioItems = $('main').find('[data-qa=sensitiveInformation]').find('.govuk-radios__item')
    expect($(sensitiveInfoRadioItems).eq(0).find('.govuk-radios__input[value=Yes][checked]').length).toBe(1)
  })
})
