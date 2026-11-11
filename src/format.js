export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function daysBetween(fromIso, toIso) {
  const start = Date.parse(`${fromIso}T00:00:00Z`)
  const end = Date.parse(`${toIso}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000)
}

export function addDays(iso, amount) {
  const time = Date.parse(`${iso}T00:00:00Z`) + amount * 86_400_000
  return new Date(time).toISOString().slice(0, 10)
}

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

export function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  const base = `${day} ${MONTHS[month - 1]}`
  return year === 2026 ? base : `${base} ${year}`
}

export function formatDateWithYear(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function formatFull(iso) {
  const date = new Date(`${iso}T00:00:00Z`)
  return `${WEEKDAYS[date.getUTCDay()]}, ${formatDate(iso)}`
}

export function plural(count, forms) {
  const tens = count % 10
  const hundreds = count % 100
  if (tens === 1 && hundreds !== 11) return `${count} ${forms[0]}`
  if (tens >= 2 && tens <= 4 && (hundreds < 12 || hundreds > 14)) return `${count} ${forms[1]}`
  return `${count} ${forms[2]}`
}

export function duePhrase(daysLeft) {
  if (daysLeft <= 0) return 'сегодня'
  if (daysLeft === 1) return 'завтра'
  return `через ${plural(daysLeft, ['день', 'дня', 'дней'])}`
}

export function joinNames(names) {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} и ${names[1]}`
  return `${names.slice(0, -1).join(', ')} и ${names.at(-1)}`
}

export function normalizeSearch(value) {
  return value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()
}

export function readRoute() {
  const raw = window.location.hash.replace(/^#/, '')
  const [viewRaw, personId] = raw.split('/')
  const view = ['queue', 'roster', 'tasks', 'rules'].includes(viewRaw) ? viewRaw : 'queue'
  return { view, personId: personId || null }
}
