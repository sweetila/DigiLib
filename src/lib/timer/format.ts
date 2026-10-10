export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000)
  return formatClockSeconds(seconds)
}

export function formatOvertime(ms: number): string {
  const seconds = Math.ceil(Math.max(0, -ms) / 1000)
  return `+${formatClockSeconds(seconds)}`
}

export function formatDuration(sec: number): string {
  const seconds = Math.max(0, Math.floor(sec))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours > 0) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  return `${minutes}m`
}

export function ringProgress(plannedSec: number, remaining: number): number {
  if (!Number.isFinite(plannedSec) || plannedSec <= 0) return 0
  return Math.min(1, Math.max(0, 1 - remaining / (plannedSec * 1000)))
}

function formatClockSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  const twoDigits = (value: number) => String(value).padStart(2, '0')
  return hours > 0
    ? `${hours}:${twoDigits(minutes)}:${twoDigits(remaining)}`
    : `${twoDigits(minutes)}:${twoDigits(remaining)}`
}
