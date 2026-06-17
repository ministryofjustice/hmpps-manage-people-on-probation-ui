import { toSentenceCase } from './toSentenceCase'

export const formatEnforcementActionNote = (str: string): string => {
  if (!str) return ''
  const lines = str.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('Enforcement Action:')) {
      const split = lines[i].split(':')
      lines[i] =
        `<span class="govuk-!-font-weight-bold">${toSentenceCase(split[0])}:</span> ${split[1].toLowerCase().trim()}`
    }
  }
  return lines.join('\n')
}
