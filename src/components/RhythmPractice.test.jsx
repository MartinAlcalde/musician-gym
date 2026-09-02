import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RhythmPractice } from './RhythmPractice.jsx'

describe('RhythmPractice', () => {
  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('integrates the configurable R3 rhythm trainer', () => {
    const { container } = render(
      <RhythmPractice screenWakeLock={{ request: vi.fn(), release: vi.fn() }} />
    )

    expect(screen.getByRole('heading', { name: /Rhythm trainer/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hands' }).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelectorAll('.rhythm-step')).toHaveLength(8)

    fireEvent.change(screen.getByLabelText('Time signature'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Subdivision'), { target: { value: 'triplet' } })
    expect(container.querySelectorAll('.rhythm-step')).toHaveLength(9)

    fireEvent.click(screen.getByRole('button', { name: 'Guitar' }))
    expect(container.querySelector('.rhythm-step strong').textContent).toMatch(/[↓↑–]/)
  })

  it('starts its Web Audio scheduler and manages the screen wake lock', async () => {
    vi.useFakeTimers()
    const oscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    }
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    }
    const audioContext = {
      currentTime: 0,
      state: 'running',
      destination: {},
      createOscillator: vi.fn(() => ({ ...oscillator })),
      createGain: vi.fn(() => gain),
      close: vi.fn(async () => {})
    }
    class AudioContextMock {
      constructor() {
        return audioContext
      }
    }
    vi.stubGlobal('AudioContext', AudioContextMock)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const screenWakeLock = { request: vi.fn(async () => true), release: vi.fn(async () => {}) }
    render(<RhythmPractice screenWakeLock={screenWakeLock} />)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Play' })))
    expect(audioContext.createOscillator).toHaveBeenCalled()
    expect(screenWakeLock.request).toHaveBeenCalledTimes(1)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Pause' })))
    expect(screenWakeLock.release).toHaveBeenCalled()
  })
})
