import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { useUIStore } from '@/store/useUIStore'

describe('study room shell', () => {
  beforeEach(() => {
    useUIStore.setState({ activePanel: null })
  })

  it('opens the matching panel and closes it with Escape', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Tasks' }))
    expect(await screen.findByText('Your tasks will appear here.')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByText('Your tasks will appear here.')).toBeNull())
  })
})