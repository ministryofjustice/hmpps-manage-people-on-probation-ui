import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'

const formatOut = bunyanFormat({ outputMode: 'short', color: false })

export default bunyan.createLogger({ name: 'Manage people on probation', stream: formatOut, level: 'debug' })
