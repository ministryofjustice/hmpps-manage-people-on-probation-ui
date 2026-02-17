import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'
import config from './config'

const formatOut = bunyanFormat({ outputMode: 'short', color: !config.production })

const logger = bunyan.createLogger({ name: 'Manage people on probation', stream: formatOut, level: 'debug' })

export default logger
