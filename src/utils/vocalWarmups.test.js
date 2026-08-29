import { describe, expect, it } from 'vitest'
import { SCALE_TYPES } from './constants.js'
import {
  buildVocalWarmupSequence,
  getVoiceProfileTonicMidi,
  VOCAL_WARMUPS
} from './vocalWarmups.js'

describe('vocal warm-up sequences', () => {
  it('plays a five-note pattern in real time and transposes each round by a semitone', () => {
    const sequence = buildVocalWarmupSequence({
      warmupId: 'fiveTone',
      tonicMidi: 60,
      scaleType: 'major',
      keyCount: 3
    })

    expect(sequence).toHaveLength(27)
    expect(sequence.slice(0, 9).map(event => event.midi)).toEqual([60, 62, 64, 65, 67, 65, 64, 62, 60])
    expect(sequence[9].cycleTonicMidi).toBe(61)
    expect(sequence[18].cycleTonicMidi).toBe(62)
  })

  it('uses the selected scale formula for every warm-up and mode', () => {
    for (const scale of Object.values(SCALE_TYPES)) {
      for (const warmup of VOCAL_WARMUPS.filter(option => !option.segments)) {
        const sequence = buildVocalWarmupSequence({
          warmupId: warmup.id,
          tonicMidi: 60,
          scaleType: scale.id,
          keyCount: 1
        })
        const intervals = [...scale.intervals, 12]
        expect(sequence.map(event => event.midi)).toEqual(
          warmup.degrees.map(degree => 60 + intervals[degree])
        )
      }
    }
  })

  it('reproduces the five DREKXEL blocks and restarts the tonic for each one', () => {
    const sequence = buildVocalWarmupSequence({
      warmupId: 'drekxelRoutine',
      tonicMidi: 48,
      scaleType: 'naturalMinor',
      keyCount: 1
    })

    expect(sequence).toHaveLength(29)
    expect(sequence.slice(0, 5).map(event => event.midi)).toEqual([48, 52, 55, 52, 48])
    expect(sequence.slice(5, 12).map(event => event.midi)).toEqual([48, 52, 55, 60, 55, 52, 48])
    expect(sequence.slice(12, 15).map(event => event.midi)).toEqual([48, 60, 48])
    expect(sequence.filter(event => event.patternIndex === 0).map(event => event.segmentId)).toEqual([
      'mmmhh', 'rrrr', 'bubbles', 'buzz', 'puffedCheeks'
    ])
  })

  it('can build one DREKXEL block as an independent warm-up', () => {
    const sequence = buildVocalWarmupSequence({
      warmupId: 'drekxelRoutine',
      segmentId: 'rrrr',
      tonicMidi: 48,
      keyCount: 2
    })

    expect(sequence).toHaveLength(14)
    expect(sequence.every(event => event.segmentId === 'rrrr')).toBe(true)
    expect(sequence[0].cycleTonicMidi).toBe(48)
    expect(sequence[7].cycleTonicMidi).toBe(49)
  })

  it('places male and female profiles one octave apart near a comfortable C', () => {
    expect(getVoiceProfileTonicMidi(0, 'male')).toBe(48)
    expect(getVoiceProfileTonicMidi(0, 'female')).toBe(60)
    expect(getVoiceProfileTonicMidi(11, 'male')).toBe(47)
    expect(getVoiceProfileTonicMidi(11, 'female')).toBe(59)
  })
})
