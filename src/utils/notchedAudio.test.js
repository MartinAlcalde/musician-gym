import { describe, expect, it } from 'vitest'
import {
  clampTinnitusFrequency,
  formatAudioTime,
  formatFrequency,
  frequencyToSlider,
  getNotchBounds,
  getNotchQ,
  sliderToFrequency
} from './notchedAudio.js'

describe('notched audio helpers', () => {
  it('builds a one-octave band centered geometrically on the matched frequency', () => {
    const bounds = getNotchBounds(6000, 1)
    expect(bounds.lower).toBeCloseTo(4242.64, 1)
    expect(bounds.upper).toBeCloseTo(8485.28, 1)
    expect(bounds.upper / bounds.lower).toBeCloseTo(2)
    expect(getNotchQ(6000, 1)).toBeCloseTo(Math.SQRT2)
  })

  it('clamps unsafe or unsupported frequency input and round-trips the logarithmic slider', () => {
    expect(clampTinnitusFrequency(10)).toBe(125)
    expect(clampTinnitusFrequency(20000)).toBe(12000)
    expect(sliderToFrequency(frequencyToSlider(7250))).toBe(7250)
  })

  it('formats frequency and playback time for the interface', () => {
    expect(formatFrequency(750)).toBe('750 Hz')
    expect(formatFrequency(6000)).toBe('6 kHz')
    expect(formatFrequency(6250)).toBe('6.3 kHz')
    expect(formatAudioTime(125.9)).toBe('2:05')
  })
})
