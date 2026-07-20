import { activityLinkUrl } from './activityContactLinkUrl'

describe('activityLinkUrl', () => {
  it('should generate an activity link with an encoded back link', () => {
    const result = activityLinkUrl('X976077', '2510727804', '2510296144')

    expect(result).toEqual(
      '/case/X976077/activity/2510727804?back=%2Fcase%2FX976077%2Fappointments%2Fappointment%2F2510296144%2Fmanage%3Fback%3D%2Fcase%2FX976077%2Fappointments',
    )
  })

  it('should include the appointment id in the back link', () => {
    const result = activityLinkUrl('X123456', '999999', '123456789')

    expect(decodeURIComponent(result.split('back=')[1])).toEqual(
      '/case/X123456/appointments/appointment/123456789/manage?back=/case/X123456/appointments',
    )
  })
})
