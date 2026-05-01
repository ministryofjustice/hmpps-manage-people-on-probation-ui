import { Route } from '../@types'
import { Option } from '../models/Option'

export const getSmsConfirmationOptions: Route<void> = (_req, res, next): void => {
  const { case: _case } = res.locals
  const options: Option[] = _case?.mobileNumber
    ? [
        { text: 'Yes', value: 'YES' },
        { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
      ]
    : [{ text: 'Yes, add a mobile number', value: 'YES_ADD_MOBILE_NUMBER' }]
  res.locals.smsConfirmationOptions = [...options, { text: 'No', value: 'NO' }]
  return next()
}
