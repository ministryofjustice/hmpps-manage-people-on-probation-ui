import httpMocks from 'node-mocks-http'

import { decorateFormAttributes } from './decorateFormAttributes'
import { mockAppResponse } from '../controllers/mocks'

describe('utils/decorateFormAttributes', () => {
  const crn = 'X000001'
  const id = '19a88188-6013-43a7-bb4d-6e338516818f'
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should decorate a checkbox group with selected options from the value stored in the session', () => {
    const res = mockAppResponse()
    const req = httpMocks.createRequest({
      session: {
        data: {
          appointments: {
            [crn]: { [id]: { type: ['Home visit', 'Initial appointment - home visit'] } },
          },
        },
      },
    })
    const sections = ['appointments', crn, id, 'type']
    const obj = {
      fieldset: {
        legend: {
          html: '<span data-qa="pageHeading">What appointment are you arranging?</span>',
          isPageHeading: true,
        },
        attributes: { 'data-qa': 'type' },
      },
      items: [
        { text: 'Home visit' },
        {
          text: 'Initial appointment - home visit',
          value: 'Initial appointment - home visit',
        },
        {
          text: 'Initial appointment - in office',
          value: 'Initial appointment - in office',
        },
        { text: 'Planned office visit', value: 'Planned office visit' },
      ],
    }
    const expected = {
      ...obj,
      id: `appointments-${crn}-${id}-type`,
      idPrefix: `appointments-${crn}-${id}-type`,
      name: `[appointments][${crn}][${id}][type]`,
      items: [
        { ...obj.items[0], value: obj.items[0].text, checked: 'checked', selected: 'selected' },
        { ...obj.items[1], value: obj.items[1].text, checked: 'checked', selected: 'selected' },
        ...obj.items.slice(2),
      ],
    }
    expect(decorateFormAttributes(req, res)(obj, sections)).toEqual(expected)
  })
  it('should decorate a radio button list with the selected option from the value stored in the session', () => {
    const res = mockAppResponse()
    const req = httpMocks.createRequest({
      session: {
        data: {
          appointments: {
            [crn]: { [id]: { type: 'Home visit' } },
          },
        },
      },
    })
    const sections = ['appointments', crn, id, 'type']
    const obj = {
      fieldset: {
        legend: {
          html: '<span data-qa="pageHeading">What appointment are you arranging?</span>',
          isPageHeading: true,
        },
        attributes: { 'data-qa': 'type' },
      },
      items: [
        { text: 'Home visit' },
        {
          text: 'Initial appointment - home visit',
          value: 'Initial appointment - home visit',
        },
        {
          text: 'Initial appointment - in office',
          value: 'Initial appointment - in office',
        },
        { text: 'Planned office visit', value: 'Planned office visit' },
      ],
    }
    const expected = {
      ...obj,
      id: `appointments-${crn}-${id}-type`,
      idPrefix: `appointments-${crn}-${id}-type`,
      name: `[appointments][${crn}][${id}][type]`,
      items: [
        { ...obj.items[0], value: obj.items[0].text, checked: 'checked', selected: 'selected' },
        ...obj.items.slice(1),
      ],
    }
    expect(decorateFormAttributes(req, res)(obj, sections)).toEqual(expected)
  })
  it('should decorate a date input value from the value stored in the session', () => {
    const res = mockAppResponse({
      errorMessages: {
        [`appointments-${crn}-${id}-date`]: 'An error message',
      },
    })

    const req = httpMocks.createRequest({
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'Home visit',
                sentence: '12 month Community order',
                'sentence-licence-condition': 'Alcohol Monitoring (Electronic Monitoring)',
                'sentence-requirement': '',
                location: 'HMP Wakefield',
                date: '2025-04-09',
              },
            },
          },
        },
      },
    })
    const sections = ['appointments', crn, id, 'date']
    const obj = {
      label: { text: 'Date', classes: 'govuk-label--s' },
      hint: { text: 'For example, 17/5/2024.' },
      minDate: '08/04/2025',
      value: '',
      id: `appointments-${crn}-${id}-date`,
      name: `[appointments][${crn}][${id}][date]`,
    }
    const expected = {
      ...obj,
      value: '9/4/2025',
      errorMessage: { text: 'An error message' },
    }
    const result = decorateFormAttributes(req, res)(obj, sections)
    expect(result).toEqual(expected)
  })
})
