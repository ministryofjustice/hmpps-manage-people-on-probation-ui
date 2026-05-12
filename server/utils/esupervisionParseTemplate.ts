export const parseQuestionTemplate = (availableTemplates: any[], questionId: string | number) => {
  const selectedTemplate = availableTemplates?.find((q: any) => String(q.id) === String(questionId))

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
