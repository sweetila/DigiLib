export const SOURCE_TUNING = {
  noiseBufferSeconds: 8,
  sourceRampSeconds: 0.05,
  stopFadeSeconds: 0.2,
  cleanupTailMs: 50,
  envelopeFloorGain: 0.001,
  scheduler: {
    tickMs: 25,
    lookaheadSeconds: 0.12,
    minimumLeadSeconds: 0.015,
  },
  white: {
    baseGain: 0.12,
    lowpassHz: 6800,
    tiltShelfHz: [700, 2800],
    tiltShelfGain: 0.84,
  },
  brown: {
    baseGain: 0.34,
    lowpassHz: 500,
    driftCenterGain: 1,
    driftRateHz: 0.025,
    driftDepth: 0.04,
  },
  rain: {
    baseGain: 0.22,
    lowpassHz: 7200,
    washLowHz: 1000,
    washHighHz: 3900,
    washGain: 0.54,
    rumbleLowHz: 65,
    rumbleHighHz: 320,
    rumbleGain: 0.12,
    rumbleQ: 0.7,
    dropletGain: 0.025,
    dropletLowpassHz: 7800,
    dropletHighpassMinHz: 2200,
    dropletHighpassMaxHz: 5200,
    dropletRateMinHz: 2.5,
    dropletRateMaxHz: 5,
    dropletDurationMinSeconds: 0.025,
    dropletDurationMaxSeconds: 0.075,
    dropletPitchMin: 0.75,
    dropletPitchMax: 1.45,
    dropletPanMin: -1,
    dropletPanMax: 1,
    dropletDecaySeconds: 0.04,
    dropletOffsetMaxSeconds: 7.5,
  },
  ocean: {
    baseGain: 0.28,
    lowpassHz: 950,
    swellLowHz: 80,
    swellHighHz: 500,
    cycleMinSeconds: 7,
    cycleMaxSeconds: 12,
    swellFloor: 0.12,
    swellPeak: 0.72,
    swellCrestFraction: 0.42,
    foamHighpassHz: 1100,
    foamLowpassHz: 6500,
    foamGain: 0.16,
  },
  wind: {
    baseGain: 0.22,
    lowpassHz: 5200,
    bandpassHz: 650,
    bandpassQ: 0.65,
    gustBaseGain: 0.35,
    centerLfoRatesHz: [0.07, 0.13, 0.31],
    centerLfoDepthsHz: [110, 70, 28],
    gainLfoRatesHz: [0.071, 0.137, 0.293],
    gainLfoDepths: [0.12, 0.06, 0.025],
    whistleHz: 1750,
    whistleQ: 8,
    whistleGain: 0.018,
  },
  cafe: {
    baseGain: 0.2,
    lowpassHz: 6000,
    formantsHz: [300, 900, 2200, 3600],
    formantQ: 1.1,
    formantGains: [0.16, 0.12, 0.07, 0.025],
    formantSweepDepthHz: [45, 110, 260, 420],
    formantSweepMinIntervalSeconds: 1.7,
    formantSweepMaxIntervalSeconds: 4.2,
    formantSweepTimeConstantSeconds: 1.2,
    clinkGain: 0.012,
    clinkMinHz: 2000,
    clinkMaxHz: 5000,
    clinkMinIntervalSeconds: 4,
    clinkMaxIntervalSeconds: 15,
    clinkDurationSeconds: 0.045,
    clinkDecaySeconds: 0.035,
    clinkFloorGain: 0.001,
    clinkPanMin: -1,
    clinkPanMax: 1,
  },
  delta: {
    baseGain: 0.18,
    lowpassHz: 850,
    carrierHz: 104,
    beatHz: 2,
    padDetuneCents: [-7, 0, 7],
    padPan: [-0.7, 0, 0.7],
    padFrequencyRatio: 0.5,
    swellCenterGain: 1,
    padGain: 0.09,
    brownPadGain: 0.08,
    brownLowpassHz: 250,
    swellRateHz: 0.025,
    swellDepth: 0.08,
  },
  theta: {
    baseGain: 0.16,
    lowpassHz: 2200,
    carrierHz: 155,
    beatHz: 6,
    padDetuneCents: [-5, 5],
    padPan: [-0.45, 0.45],
    padFrequencyRatio: 0.5,
    swellCenterGain: 1,
    padGain: 0.08,
    brownPadGain: 0.035,
    brownLowpassHz: 460,
    filterSweepRateHz: 0.035,
    filterSweepDepthHz: 180,
    swellRateHz: 0.018,
    swellDepth: 0.07,
  },
} as const

export type SourceTuning = typeof SOURCE_TUNING

export function isValidSourceTuning(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (!validateNumbers(value)) return false

  const config = value as Record<string, unknown>
  const scheduler = config.scheduler as Record<string, unknown> | undefined
  if (
    typeof config.noiseBufferSeconds !== 'number' ||
    config.noiseBufferSeconds < 8 ||
    !scheduler ||
    !isPositive(scheduler.tickMs) ||
    !isPositive(scheduler.lookaheadSeconds) ||
    !isPositive(scheduler.minimumLeadSeconds)
  )
    return false

  for (const id of [
    'white',
    'brown',
    'rain',
    'ocean',
    'wind',
    'cafe',
    'delta',
    'theta',
  ]) {
    const source = config[id] as Record<string, unknown> | undefined
    if (
      !source ||
      !isPositive(source.lowpassHz) ||
      typeof source.baseGain !== 'number' ||
      source.baseGain <= 0 ||
      source.baseGain > 1
    )
      return false
  }
  return true
}

function validateNumbers(value: unknown, key = ''): boolean {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return false
    if (key.toLowerCase().includes('pan')) return value >= -1 && value <= 1
    if (key.toLowerCase().includes('detune')) return Math.abs(value) <= 1200
    return value >= 0
  }
  if (Array.isArray(value))
    return value.length > 0 && value.every((item) => validateNumbers(item, key))
  if (typeof value !== 'object' || value === null) return false
  const entries = Object.entries(value)
  return (
    entries.length > 0 &&
    entries.every(([entryKey, entry]) => validateNumbers(entry, entryKey))
  )
}

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
