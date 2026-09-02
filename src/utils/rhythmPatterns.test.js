import { describe, expect, it } from 'vitest'
import {
  createRhythmPresetPattern,
  generateRhythmPattern,
  getRhythmCountLabels,
  isRhythmPattern,
  rhythmPatternText,
  secondsPerRhythmStep
} from './rhythmPatterns.js'

describe('rhythm patterns', () => {
  it('builds a valid pattern for every meter and subdivision', () => {
    for (const beats of [2, 3, 4, 5, 7]) {
      for (const division of ['quarter', 'eighth', 'triplet', 'sixteenth']) {
        const pattern = generateRhythmPattern({ beats, division, level: 5, random: () => 0.42 })
        const perBeat = { quarter: 1, eighth: 2, triplet: 3, sixteenth: 4 }[division]
        expect(pattern.steps).toHaveLength(beats * perBeat)
        expect(isRhythmPattern(pattern)).toBe(true)
        expect(pattern.steps.filter(step => step.accent)).toHaveLength(1)
      }
    }
  })

  it('keeps strict alternation in fixed mode and allows coordinated free sticking', () => {
    const fixed = generateRhythmPattern({ mode: 'fixed', level: 4, random: () => 0.35 })
    fixed.steps.forEach((step, index) => {
      if (step.hand) expect(step.hand).toBe(index % 2 === 0 ? 'R' : 'L')
    })

    const free = generateRhythmPattern({ mode: 'free', level: 8, random: () => 0.2 })
    expect(free.steps.some(step => step.hand === 'R')).toBe(true)
    expect(free.steps.some(step => step.hand === 'L')).toBe(true)
  })

  it('counts common subdivisions and computes scheduler timing', () => {
    expect(getRhythmCountLabels(2, 'eighth')).toEqual(['1', '&', '2', '&'])
    expect(getRhythmCountLabels(1, 'triplet')).toEqual(['1', 'tri', 'plet'])
    expect(secondsPerRhythmStep(120, 'sixteenth')).toBe(0.125)
  })

  it('copies notation using the selected language', () => {
    const pattern = generateRhythmPattern({ random: () => 0.2 })
    expect(rhythmPatternText(pattern, 'es')).toContain('Musician Gym · Rhythm')
    expect(rhythmPatternText(pattern, 'es')).toMatch(/[DI]/)
    expect(rhythmPatternText(pattern, 'en')).toMatch(/[RL]/)
  })

  it('keeps the original quick-start patterns available', () => {
    const preset = createRhythmPresetPattern('free-medium')
    expect(preset.mode).toBe('free')
    expect(preset.level).toBe(5)
    expect(preset.steps).toHaveLength(8)
    expect(isRhythmPattern(preset)).toBe(true)
  })
})
