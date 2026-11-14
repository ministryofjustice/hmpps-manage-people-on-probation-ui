export const parseQuestionTemplate = (
  availableTemplates: {
    template: string
    responseSpec: { placeholders: string[] }
    questionExamples: string[]
    id: string
  }[],
  questionId: string | number,
) => {
  const selectedTemplate = availableTemplates?.find(q => String(q.id) === String(questionId))

  if (!selectedTemplate) return null

  const { template, responseSpec, questionExamples } = selectedTemplate
  const placeholderWord = responseSpec?.placeholders?.[0]
  const splitTarget = `{{${placeholderWord}}}`
  const [prefix, suffix = ''] = template.split(splitTarget)

  return {
    id: selectedTemplate.id,
    prefix,
    suffix,
    placeholderWord,
    questionExamples,
  }
}
