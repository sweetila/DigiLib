import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUIStore } from '@/store/useUIStore'
import NoticeToast from './NoticeToast'

describe('NoticeToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useUIStore.setState({ notice: null })
  })
  afterEach(() => vi.useRealTimers())

  it('announces, dismisses manually, and automatically dismisses after six seconds', () => {
    const { rerender } = render(<NoticeToast />)
    useUIStore.getState().showNotice('Session saved.')
    rerender(<NoticeToast />)
    expect(screen.getByRole('status')).toHaveTextContent('Session saved.')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(screen.queryByRole('status')).toBeNull()

    useUIStore.getState().showNotice('Break time.')
    rerender(<NoticeToast />)
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
