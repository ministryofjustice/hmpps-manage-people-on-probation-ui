import slugify from 'slugify'

export const toSlug = (string: string) => {
  return slugify(string, { lower: true })
}
