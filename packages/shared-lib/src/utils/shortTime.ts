import { DateTime } from 'luxon'

export const shortTime = (isoTime: string) => {
  const time = DateTime.fromISO(isoTime)
  return (time.minute.valueOf() > 0 ? time.toFormat('h:mma') : time.toFormat('ha')).toLocaleLowerCase()
}
