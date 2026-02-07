import DayJS from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import es from 'dayjs/locale/es'

import utc from 'dayjs/plugin/utc'

DayJS.extend(relativeTime)
DayJS.locale(es)
DayJS.extend(utc)

export default DayJS
