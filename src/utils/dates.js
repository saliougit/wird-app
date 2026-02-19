// Formatage et calculs de dates

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function formatShort(dateStr) {
  return formatDate(dateStr, { day: '2-digit', month: 'short', year: undefined })
}

export function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00')
  const b = new Date(dateB + 'T00:00:00')
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export function daysUntil(endDate) {
  return daysBetween(today(), endDate)
}

export function daysOverdue(endDate) {
  const diff = daysUntil(endDate)
  return diff < 0 ? Math.abs(diff) : 0
}

export function isOverdue(endDate) {
  return endDate && today() > endDate
}

export function suggestEndDate(startDate, days = 30) {
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + days - 1)
  return d.toISOString().split('T')[0]
}

export function dateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return 'Pas de délai'
  if (!endDate) return `Depuis le ${formatShort(startDate)}`
  return `${formatShort(startDate)} → ${formatShort(endDate)}`
}

// Retourne le nom du jour de la semaine en français
export function weekdayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long' })
}

// Retourne un tableau des 7 derniers jours ISO
export function lastSevenDays() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}
