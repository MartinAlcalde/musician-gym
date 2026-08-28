import { describe, expect, it } from 'vitest'
import {
  clampNotchDistance,
  clampTinnitusFrequency,
  formatAudioTime,
  formatFrequency,
  frequencyToSlider,
  frequencyToSliderPercent,
  getMaxNotchDistance,
  getNotchBounds,
  getNotchQ,
  sliderToFrequency
} from './notchedAudio.js'

describe('notched audio helpers', () => {
  it('builds a symmetric band from an exact Hz distance on each side', () => {
    const bounds = getNotchBounds(6000, 500)
    expect(bounds.lower).toBe(5500)
    expect(bounds.upper).toBe(6500)
    expect(6000 - bounds.lower).toBe(500)
    expect(bounds.upper - 6000).toBe(500)
    expect(getNotchQ(6000, 500)).toBe(6)
  })

  it('keeps the selected distance within the audible filter range', () => {
    expect(getMaxNotchDistance(6000)).toBe(5980)
    expect(clampNotchDistance(9000, 6000)).toBe(5980)
    expect(clampNotchDistance(500, 125)).toBe(105)
  })

  it('clamps unsafe or unsupported frequency input and round-trips the logarithmic slider', () => {
    expect(clampTinnitusFrequency(10)).toBe(125)
    expect(clampTinnitusFrequency(20000)).toBe(12000)
    expect(sliderToFrequency(frequencyToSlider(7250))).toBe(7250)
  })

  it('places every frequency reference on the same logarithmic scale as the slider', () => {
    expect(frequencyToSliderPercent(125)).toBe(0)
    expect(frequencyToSliderPercent(12000)).toBe(100)
    expect(frequencyToSliderPercent(1000)).toBeCloseTo(45.57, 1)
    expect(frequencyToSliderPercent(4000)).toBeCloseTo(75.96, 1)
  })

  it('formats frequency and playback time for the interface', () => {
    expect(formatFrequency(750)).toBe('750 Hz')
    expect(formatFrequency(6000)).toBe('6 kHz')
    expect(formatFrequency(6250)).toBe('6.3 kHz')
    expect(formatAudioTime(125.9)).toBe('2:05')
  })
})
