import { Route } from '../@types'
import { Option } from '../models/Option'

export const getSmsConfirmationOptions = (inline = true): Route<void | Option[]> => {
  return function getSmsConfirmationOptionsInner(_req, res, next?) {
    if (res.locals?.flags?.enableAllowSms && inline) {
      return next()
    }
    const { case: _case } = res.locals
    const options: Option[] = _case?.mobileNumber
      ? [
          { text: 'Yes', value: 'YES' },
          { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
        ]
      : [{ text: 'Yes, add a mobile number', value: 'YES_ADD_MOBILE_NUMBER' }]
    if (res.locals?.flags?.enableAllowSms && !inline) {
      return [...options, { text: 'No', value: 'NO' }]
    }
    res.locals.smsConfirmationOptions = [...options, { text: 'No', value: 'NO' }]
    return next()
  }
}
