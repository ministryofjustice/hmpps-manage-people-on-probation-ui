export const toErrorList = (errors: Record<string, string>) => {
  return Object.entries(errors).map(error => {
    return {
      text: error[1],
      href: `#${error[0]}`,
    }
  })
}
