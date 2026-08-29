import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SingingPractice } from './SingingPractice.jsx'

describe('SingingPractice', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

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
    expect(screen.getAllByRole('radio', { name: /MMMMHH|RRRR|Bubbles|DZZZ|BBBB/ })).toHaveLength(5)
    expect(screen.getByRole('slider', { name: 'Warm-up position' }).disabled).toBe(true)
  })

  it('continues automatically with the next DREKXEL block', async () => {
    vi.useFakeTimers()
    const playTone = vi.fn()
    const speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn()
    }
    class SpeechSynthesisUtteranceMock {
      constructor(text) {
        this.text = text
      }
    }
    vi.stubGlobal('speechSynthesis', speechSynthesis)
    vi.stubGlobal('SpeechSynthesisUtterance', SpeechSynthesisUtteranceMock)
    render(
      <SingingPractice
        audio={{
          isReady: true,
          playTone,
          getCurrentTime: vi.fn(() => 0),
          startAudioContext: vi.fn(async () => true)
        }}
        tonicMidi={60}
        scaleType="major"
        notation="solfege"
        screenWakeLock={{ request: vi.fn(async () => true), release: vi.fn() }}
      />
    )

    fireEvent.click(screen.getByText('DREKXEL guided routine'))
    fireEvent.change(screen.getByLabelText('Tempo'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText('Ascending keys'), { target: { value: '3' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start warm-up/i }))
      await Promise.resolve()
    })

    expect(playTone).not.toHaveBeenCalled()
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1)
    const firstAnnouncement = speechSynthesis.speak.mock.calls[0][0]
    expect(firstAnnouncement.text).toBe('M humming for resonance.')
    expect(firstAnnouncement.lang).toBe('en-US')

    await act(async () => {
      firstAnnouncement.onend()
      await Promise.resolve()
    })
    expect(playTone).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(18000))

    expect(screen.getByRole('radio', { name: /RRRR · tongue trill/i }).checked).toBe(true)
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(2)
    expect(speechSynthesis.speak.mock.calls[1][0].text).toBe('Rolled R tongue trill.')
    expect(playTone).toHaveBeenCalledTimes(15)

    await act(async () => {
      speechSynthesis.speak.mock.calls[1][0].onend()
      await Promise.resolve()
    })
    expect(playTone).toHaveBeenCalledTimes(16)
    expect(playTone.mock.calls.at(-1)[0]).toBe(48)
  })
})
