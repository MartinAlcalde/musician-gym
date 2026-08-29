import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SingingPractice } from './SingingPractice.jsx'

describe('SingingPractice', () => {
  afterEach(() => localStorage.clear())

  it('adapts the starting octave for male and female voice profiles', () => {
    render(
      <SingingPractice
        audio={{
          isReady: true,
          playTone: vi.fn(),
          getCurrentTime: vi.fn(() => 0),
          startAudioContext: vi.fn(async () => true)
        }}
        tonicMidi={60}
        scaleType="major"
        notation="solfege"
        screenWakeLock={{ request: vi.fn(), release: vi.fn() }}
      />
    )

    const voiceRange = screen.getByLabelText(/voice range/i)
    expect(voiceRange.value).toBe('male')
    expect(screen.getByText('Approximate piano range: C3–B3')).toBeTruthy()

    fireEvent.change(voiceRange, { target: { value: 'female' } })
    expect(screen.getByText('Approximate piano range: C4–B4')).toBeTruthy()
  })

  it('shows the adapted DREKXEL routine and links to the original warm-up', () => {
    render(
      <SingingPractice
        audio={{
          isReady: true,
          playTone: vi.fn(),
          getCurrentTime: vi.fn(() => 0),
          startAudioContext: vi.fn(async () => true)
        }}
        tonicMidi={60}
        scaleType="major"
        notation="solfege"
        screenWakeLock={{ request: vi.fn(), release: vi.fn() }}
      />
    )

    fireEvent.click(screen.getByText('DREKXEL guided routine'))

    const source = screen.getByRole('link', { name: 'the original DREKXEL warm-up' })
    expect(source.getAttribute('href')).toBe('https://www.youtube.com/watch?v=rgP_zKTvlE8')
    expect(screen.getByText(/5 guided blocks/)).toBeTruthy()
  })
})
