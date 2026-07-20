import { formatEnforcementActionNote } from './formatEnforcementActionNote'

const enforcementAction = 'Enforcement Action: First Warning Letter Sent'

const mockNote = (note = '') => `fdsfdsfs\n15/06/2026 15:27'\n${note}`

describe('utils/formatEnforcementActionNote', () => {
  it('should return the string if no value', () => {
    expect(formatEnforcementActionNote('')).toEqual('')
  })
  it('should not format the note if not an enforcement action', () => {
    const note = mockNote('Latest Update: Some Notes')
    expect(formatEnforcementActionNote(note)).toEqual(note)
  })
  it('should format the note if is an enforcement action', () => {
    const note = mockNote(enforcementAction)
    const expectedNote = `${mockNote()}<span class="govuk-!-font-weight-bold">Enforcement action:</span> first warning letter sent`
    expect(formatEnforcementActionNote(note)).toEqual(expectedNote)
  })
})
