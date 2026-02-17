import { addError } from './addError'

describe('utils/addError', () => {
  it('should return the error list and error messages if no error argument', () => {
    const expected = {
      errorList: [
        {
          text: 'Select an appointment type',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-type',
        },
      ],

      errorMessages: {
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-type': { text: 'Select an appointment type' },
      },
    }
    expect(
      addError(null, {
        text: 'Select an appointment type',
        anchor: 'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-type',
      }),
    ).toEqual(expected)
  })
  it('should return the updated error list and error messages if error argument', () => {
    const errors = {
      errorList: [
        {
          text: 'Select an appointment date',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-date',
        },
        {
          text: 'Select an appointment start time',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-start',
        },
      ],
      errorMessages: {
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-date': { text: 'Select an appointment date' },
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-start': {
          text: 'Select an appointment start time',
        },
      },
    }
    const expected = {
      errorList: [
        {
          text: 'Select an appointment date',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-date',
        },
        {
          text: 'Select an appointment start time',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-start',
        },
        {
          text: 'Select an appointment end time',
          href: '#appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-end',
        },
      ],
      errorMessages: {
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-date': { text: 'Select an appointment date' },
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-start': {
          text: 'Select an appointment start time',
        },
        'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-end': {
          text: 'Select an appointment end time',
        },
      },
    }
    expect(
      addError(errors, {
        text: 'Select an appointment end time',
        anchor: 'appointments-X778160-19a88188-6013-43a7-bb4d-6e338516818f-end',
      }),
    ).toEqual(expected)
  })
})
