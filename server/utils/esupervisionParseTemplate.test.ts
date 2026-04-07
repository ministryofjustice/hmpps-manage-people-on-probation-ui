import { parseQuestionTemplate } from './esupervisionParseTemplate'

describe('utils/parseQuestionTemplate', () => {
  const mockQuestions = [
    { id: 1, template: 'How has [insert text] been going recently?' },
    { id: 2, template: 'How was [insert text]?' },
    { id: 3, template: 'Are you curently [insert text]?' },
  ]

  it('splits the template question into a prefix and suffix, and adds a preceding space before the suffix if the suffix is more than just punctuation (?) ', () => {
    const result = parseQuestionTemplate(mockQuestions, 1)
    expect(result).toEqual({
      id: 1,
      prefix: 'How has',
      suffix: ' been going recently?',
    })
  })

  it('splits the template question into a prefix and suffix, and the suffix is just the question mark if there are no words before it ', () => {
    const result = parseQuestionTemplate(mockQuestions, 2)
    expect(result).toEqual({
      id: 2,
      prefix: 'How was',
      suffix: '?',
    })
  })
})
