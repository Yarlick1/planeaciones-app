import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(value) {
  if (!value) return 'Sin fecha'

  try {
    return format(parseISO(value), 'd MMM yyyy', { locale: es })
  } catch {
    return value
  }
}

export function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} a ${formatDate(endDate)}`
}
