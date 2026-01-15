const mapping = {
  Monday: 'Dydd Llun',
  Tuesday: 'Dydd Mawrth',
  Wednesday: 'Dydd Mercher',
  Thursday: 'Dydd Iau',
  Friday: 'Dydd Gwener',
  Saturday: 'Dydd Sadwrn',
  Sunday: 'Dydd Sul',
  January: 'Ionawr',
  February: 'Chwefror',
  March: 'Mawrth',
  April: 'Ebrill',
  May: 'Mai',
  June: 'Mehefin',
  July: 'Gorffennaf',
  August: 'Awst',
  September: 'Medi',
  October: 'Hydref',
  November: 'Tachwedd',
  December: 'Rhagfyr',
}

export const translateToWelshDayMonth = (str: string): string => {
  if (!str) return ''
  const translatedStr = Object.entries(mapping).reduce((acc, [english, welsh]) => acc.split(english).join(welsh), str)
  return translatedStr
}
