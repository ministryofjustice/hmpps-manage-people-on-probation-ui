import { PreviousOrderHistory } from '../../data/model/previousOrderHistory'

export const mockPreviousOrders = {
  status: 200,
  jsonBody: {
    name: {
      forename: 'Caroline',
      middleName: '',
      surname: 'Wolff',
    },
    previousOrders: [
      {
        eventNumber: '3',
        title: 'CJA - Std Determinate Custody (16 Months)',
        description: 'Merchant Shipping Acts - 15000',
        terminationDate: '2024-04-09',
      },
      {
        eventNumber: '2',
        title: 'CJA - Std Determinate Custody (12 Months)',
        description: 'Army - offences associated with - 15300',
        terminationDate: '2024-04-08',
      },
    ],
  },
} as unknown as PreviousOrderHistory
