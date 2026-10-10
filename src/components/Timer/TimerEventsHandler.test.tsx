import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import { useUIStore } from '@/store/useUIStore'

vi.mock('@/lib/timer/chime', () => ({ playChime: vi.fn(), primeChime: vi.fn() }))

import { playChime } from '@/lib/timer/chime'
import TimerEventsHandler from './TimerEventsHandler'

describe('TimerEventsHandler', () => {
  beforeEach(() => {
    useTimerStore.setState({ ...initialRuntime(), lastEvent: null })
    useTimerSettingsStore.getState().resetSettings()
    useUIStore.setState({ notice: null })
    vi.mocked(playChime).mockClear()
  })

  it('announces each new completion once and plays its configured chime once', async () => {
    useTimerSettingsStore.getState().setToggle('soundNotification', true)
    const { rerender } = render(<TimerEventsHandler />)
    useTimerStore.setState({
      lastEvent: { id: 1, type: 'focusComplete', loggedSec: 840 },
    })
    await waitFor(() => expect(useUIStore.getState().notice?.message).toBe('Nice work. 14m logged. Break time.'))
    expect(playChime).toHaveBeenCalledOnce()
    rerender(<TimerEventsHandler />)
    expect(playChime).toHaveBeenCalledOnce()
  })

  it('announces uncapped overtime focus completion without a logged duration', async () => {
    render(<TimerEventsHandler />)
    useTimerStore.setState({ lastEvent: { id: 2, type: 'focusComplete' } })
    await waitFor(() => expect(useUIStore.getState().notice?.message).toBe("Nice work. Take a break whenever you're ready."))
  })
})
