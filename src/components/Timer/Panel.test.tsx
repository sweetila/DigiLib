import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import FocusClock from './FocusClock'
import TimerPanel from './Panel'

describe('TimerPanel', () => {
  beforeEach(() => {
    useTimerStore.setState({ ...initialRuntime(), lastEvent: null })
    useTimerSettingsStore.getState().resetSettings()
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('changes the idle clock with the selected preset and locks settings while running', () => {
    render(<><FocusClock /><TimerPanel /></>)
    expect(screen.getByRole('timer')).toHaveTextContent('25:00')
    fireEvent.click(screen.getByRole('radio', { name: '52/17' }))
    expect(screen.getByRole('timer')).toHaveTextContent('52:00')
    act(() => useTimerStore.getState().start())
    expect(screen.getByText('Reset the timer to change durations.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Pomodoro' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Focus minutes' })).toHaveAttribute('readonly')
  })

  it('clamps custom duration edits and handles desktop permission outcomes', async () => {
    render(<TimerPanel />)
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Focus minutes' }), { target: { value: '999' } })
    expect(screen.getByRole('spinbutton', { name: 'Focus minutes' })).toHaveValue(180)

    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    fireEvent.click(screen.getByRole('switch', { name: 'Desktop notification' }))
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Desktop notification' })).toHaveAttribute('aria-checked', 'false'))
    expect(screen.getByText('Notifications are blocked in your browser settings.')).toBeInTheDocument()

    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    })
    fireEvent.click(screen.getByRole('switch', { name: 'Desktop notification' }))
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Desktop notification' })).toHaveAttribute('aria-checked', 'true'))

    fireEvent.click(screen.getByRole('switch', { name: 'Desktop notification' }))
    vi.stubGlobal('Notification', undefined)
    fireEvent.click(screen.getByRole('switch', { name: 'Desktop notification' }))
    expect(await screen.findByText("Your browser doesn't support desktop notifications.")).toBeInTheDocument()
  })
})
