export const removeEmpty = (array: never[]) => {
  return array.filter((value: NonNullable<unknown>) => Object.keys(value).length !== 0)
}
