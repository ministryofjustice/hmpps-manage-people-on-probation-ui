import { Errors } from '../@types'

export const addError = (errors: Errors, { text, anchor }: { text: string; anchor: string }): Errors => {
  const errorList = [...(errors?.errorList || []), { text, href: `#${anchor}` }]
  const errorMessages = { ...(errors?.errorMessages || {}), [anchor]: { text } }
  return { errorList, errorMessages }
}
