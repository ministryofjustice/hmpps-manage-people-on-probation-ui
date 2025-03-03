import superagent, { Response } from 'superagent'

import caseload from './caseload'

export default {
  resetMocks: (): Promise<Array<Response>> =>
    Promise.all([superagent.post('http://localhost:9091/__admin/mappings/reset')]),
  ...caseload,
}
