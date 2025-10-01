export const BD_OFFSET_MIN = 6 * 60
export const MS = 1000
export const DAY_SEC = 24 * 60 * 60
export const WINDOW_MAX = 23 * 60 * 60
export const WINDOW_MIN = 1
export const WRAP_THRESHOLD = DAY_SEC - 3

export function two(n) {
  const x = Math.max(0, n | 0)
  return String(x).padStart(2, '0')
}

export function parseTimeString(t) {
  const m = String(t || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!m) return null
  let hh = Number(m[1])
  const mm = Number(m[2])
  const ap = m[3].toUpperCase()
  if (hh === 12) hh = 0
  if (ap === 'PM') hh += 12
  return { hh, mm }
}

export function secondsUntilInBD(timeStr) {
  const parsed = parseTimeString(timeStr)
  if (!parsed) return 0
  const now = new Date()
  const offsetMs = BD_OFFSET_MIN * 60 * MS
  const bdNowMs = now.getTime() + offsetMs
  const bdNow = new Date(bdNowMs)
  const y = bdNow.getUTCFullYear(),
    m = bdNow.getUTCMonth(),
    d = bdNow.getUTCDate()
  const targetBdUtcMs = Date.UTC(y, m, d, parsed.hh, parsed.mm, 0, 0) - offsetMs
  let deltaMs = targetBdUtcMs - now.getTime()
  if (deltaMs < 0) deltaMs += DAY_SEC * 1000
  return Math.max(0, Math.floor(deltaMs / 1000))
}

export function minPositive(...arr) {
  const pos = arr.filter((n) => n > 0)
  return pos.length ? Math.min(...pos) : 0
}

export function percentFromSeconds(leftSec) {
  if (leftSec >= WINDOW_MAX) return 0
  if (leftSec <= WINDOW_MIN) return 100
  const span = WINDOW_MAX - WINDOW_MIN
  return ((WINDOW_MAX - leftSec) / span) * 100
}

export function fmt(s) {
  const total = Math.max(0, s | 0)
  const hh = Math.floor(total / 3600),
    mm = Math.floor((total % 3600) / 60),
    ss = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(
    2,
    '0',
  )}`
}
