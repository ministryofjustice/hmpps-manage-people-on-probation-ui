import { isDefined } from './isDefined'
import { isNotNull } from './isNotNull'

export const hasValue = (val: unknown) => {
  return isNotNull(val) && isDefined(val)
}
