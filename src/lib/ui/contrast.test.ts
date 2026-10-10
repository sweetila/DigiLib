import { describe, expect, it } from 'vitest'
import { contrastRatio, hexToRgb, relativeLuminance } from './contrast'
import { palette } from './palette'

function composite(foreground: string, background: string, opacity: number): string {
  const foregroundRgb = hexToRgb(foreground)
  const backgroundRgb = hexToRgb(background)
  return `#${foregroundRgb
    .map((channel, index) =>
      Math.round(channel * opacity + backgroundRgb[index] * (1 - opacity))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

describe('UI contrast helpers', () => {
  it('converts hex colors to RGB', () => {
    expect(hexToRgb('#000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
  })

  it('calculates known luminance and contrast values', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
    expect(contrastRatio('#000000', '#ffffff')).toBe(21)
    expect(contrastRatio('#C3A6D0', '#C3A6D0')).toBe(1)
  })

  it('keeps text and mode accents WCAG AA against the app surfaces', () => {
    const panelSurface = composite(palette.panel, palette.bg, 0.7)
    const readableTokens = [
      palette.text,
      palette.muted,
      palette.accent,
      palette.sage,
      palette.apricot,
      palette.rose,
      palette.accent2,
    ]

    for (const color of readableTokens) {
      expect(contrastRatio(color, palette.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(color, panelSurface)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps status colors WCAG AA against the app background', () => {
    for (const color of [palette.danger, palette.warning, palette.success]) {
      expect(contrastRatio(color, palette.bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
