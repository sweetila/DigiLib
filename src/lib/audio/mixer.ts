export function effectiveGain(master: number, volume: number, muted: boolean): number {
  if (muted) return 0
  return clampGain(master) * clampGain(volume) ** 2
}

function clampGain(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}
