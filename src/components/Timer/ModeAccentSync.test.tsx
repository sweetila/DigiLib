import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import { useTimerStore } from '@/store/useTimerStore'
import ModeAccentSync from './ModeAccentSync'

describe('ModeAccentSync', () => {
  beforeEach(() => useTimerStore.setState({ ...initialRuntime(), lastEvent: null }))

  it('sets phase colors and uses the user accent for focus', async () => {
    render(<ModeAccentSync />)
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--mode-accent')).toBe('var(--accent)'))
    useTimerStore.setState({ phase: 'shortBreak' })
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--mode-accent')).toBe('#9BAA8C'))
    useTimerStore.setState({ phase: 'longBreak' })
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--mode-accent')).toBe('#D9A47F'))
  })
})
