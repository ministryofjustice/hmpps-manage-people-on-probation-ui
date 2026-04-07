export const parseQuestionTemplate = (availableQuestions: any[], questionId: string | number) => {
  const selectedQuestion = availableQuestions?.find((q: any) => String(q.id) === String(questionId))

  if (!selectedQuestion) return null

  const { template } = selectedQuestion
  const start = template.indexOf('[')
  const end = template.indexOf(']', start)

  let prefix: string
  let rawSuffix: string

  if (start !== -1 && end !== -1) {
    prefix = template.substring(0, start)
    rawSuffix = template.substring(end + 1)
  } else {
    prefix = template
    rawSuffix = ''
  }

  let suffix = rawSuffix.trimStart()
  if (suffix.match(/^[a-zA-Z]/)) {
    suffix = ` ${suffix}`
  }

  return {
    id: selectedQuestion.id,
    prefix: prefix.trimEnd(),
    suffix,
  }
}
