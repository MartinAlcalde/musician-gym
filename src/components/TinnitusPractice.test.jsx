import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TinnitusPractice } from './TinnitusPractice.jsx'

describe('TinnitusPractice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('keeps the detailed disclaimer available on demand', () => {
    const audioElement = {
      currentTime: 0,
      duration: 0,
      preload: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      pause: vi.fn(),
      removeAttribute: vi.fn(),
      load: vi.fn()
    }
    class AudioMock {
      constructor() {
        return audioElement
      }
    }
    vi.stubGlobal('Audio', AudioMock)

    render(
      <TinnitusPractice
        screenWakeLock={{ request: vi.fn(), release: vi.fn() }}
      />
    )

    const oneKilohertzMark = screen.getByText('1 kHz')
    expect(oneKilohertzMark.style.left).toMatch(/^45\.5/)

    const distanceInput = screen.getByLabelText(/distance on each side/i)
    expect(distanceInput.value).toBe('500')
    fireEvent.change(distanceInput, { target: { value: '750' } })
    fireEvent.blur(distanceInput)
    expect(screen.getByText('Filtered band: 5.3 kHz – 6.8 kHz')).toBeTruthy()

    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /evidence & safety/i }))
    expect(screen.getByRole('dialog', { name: /before using notched music/i })).toBeTruthy()
    expect(screen.getByText(/clinical results are mixed/i)).toBeTruthy()
    expect(screen.getByText(/synchronized with your heartbeat/i)).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
