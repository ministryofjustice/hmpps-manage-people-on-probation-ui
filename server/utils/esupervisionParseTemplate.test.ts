import { parseQuestionTemplate } from './esupervisionParseTemplate'

describe('utils/parseQuestionTemplate', () => {
  const mockQuestions = [
    {
      id: 1,
      template: 'How has {{thing}} been going recently?',
      responseSpec: { placeholders: ['thing'] },
    },
    {
      id: 2,
      template: 'How was {{thing}}?',
      responseSpec: { placeholders: ['thing'] },
    },
    {
      id: 3,
      template: 'Are you currently {{thing}}?',
      responseSpec: { placeholders: ['thing'] },
    },
  ]

  it('splits the template question into a prefix and suffix, and adds correct spacing ', () => {
    const result = parseQuestionTemplate(mockQuestions, 1)
    expect(result).toEqual({
      id: 1,
      prefix: 'How has ',
      suffix: ' been going recently?',
      placeholderWord: 'thing',
    })
  })

  it('splits the template question into a prefix and suffix with correct spacing, and the suffix is just the question mark if there are no words before it ', () => {
    const result = parseQuestionTemplate(mockQuestions, 2)
    expect(result).toEqual({
      id: 2,
      prefix: 'How was ',
      suffix: '?',
      placeholderWord: 'thing',
    })
  })
})
