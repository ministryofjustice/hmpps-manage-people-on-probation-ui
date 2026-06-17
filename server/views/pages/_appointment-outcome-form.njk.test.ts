import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { Activity } from "../../data/model/schedule"
import { AttendedCompliedAppointment } from "../../models/Appointments"
import { AppointmentOutcomeProps, AppResponse } from "../../models/Locals"
import { createNunjucksTestEnv } from "../../testutils/nunjucksTestEnv"

const crn = 'X000001'
const appointmentId = '123456'

type TestModel = {
  // Outcome
  appointmentOutcome: AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>
}

const baseModel: TestModel = {
  appointmentOutcome: {
  } as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
    appointmentOutcome: {
      ...baseModel.appointmentOutcome,
      ...model.appointmentOutcome,
    },
  }
  const req = httpMocks.createRequest({
    params: {
      crn,
      id: appointmentId,
      contactId: appointmentId,
    },
    session: {
      data: {},
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/_appointment-outcome-form.njk', input))
}

describe('Appointment outcome form nunjucks render tests', () => {
  describe('Ticket panel', () => {
    const title = 'ticket title'
    const html = 'ticket html'
    it('should render the ticket panel with given data', () => {
      const type = 'BLUE'
      const $ = render({
        appointmentOutcome: {
          ticket: {
            title,
            type,
            html 
          }
        }
      } as unknown as Partial<TestModel>)
      expect($('[data-qa="ticket-panel"]').find(`.moj-ticket-panel__content--blue`).text()).toContain(title)
      expect($('[data-qa="ticket-panel"]').find(`.moj-ticket-panel__content--blue`).text()).toContain(html)
    })
    it('should display as red when no type given', () => {
      const $ = render({
        appointmentOutcome: {
          ticket: {
            title,
            html 
          }
        }
      } as unknown as Partial<TestModel>)
      expect($('[data-qa="ticket-panel"]').find(`.moj-ticket-panel__content--red`).text()).toContain(title)
      expect($('[data-qa="ticket-panel"]').find(`.moj-ticket-panel__content--red`).text()).toContain(html)
    })
    it('should not display panel if not ticket given', () => {
      const $ = render({
        appointmentOutcome: {
        }
      } as unknown as Partial<TestModel>)
      expect($('[data-qa="ticket-panel"]').length).toBe(0)
    })
  })
  describe('Breach or recall alert', () => {
    it('should render the alert with given data', () => {
      const title = 'breach title'
      const type = 'BREACH'
      const text = 'breach text'
      const $ = render({
        appointmentOutcome: {
          breachOrRecallWarning: {
            title,
            type,
            text
          }
        }
      } as unknown as Partial<TestModel>)
      expect($('[data-qa="breach-warning"]').text()).toContain(title)
      expect($('[data-qa="breach-warning"]').text()).toContain(text)
    })
    it('should not display alert if not info given', () => {
      const $ = render({
        appointmentOutcome: {
        }
      } as unknown as Partial<TestModel>)
      expect($('[data-qa="breach-warning"]').length).toBe(0)
    })
  })
})