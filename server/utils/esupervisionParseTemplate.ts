export const parseQuestionTemplate = (availableQuestions: any[], questionId: string | number) => {
  const selectedQuestion = availableQuestions?.find((q: any) => String(q.id) === String(questionId))

  if (!selectedQuestion) return null

  const sections = selectedQuestion.template.split(/\[.*?\]/)
  const prefix = sections[0] || ''
  let suffix = sections[1] || ''

  if (suffix.trimStart().match(/^[a-zA-Z]/)) {
    suffix = ` ${suffix.trimStart()}`
  } else {
    suffix = suffix.trimStart()
  }

  return {
    id: selectedQuestion.id,
    prefix: prefix.trimEnd(),
    suffix,
  }
}
