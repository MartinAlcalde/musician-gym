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
      for (const warmup of VOCAL_WARMUPS) {
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

  it('places male and female profiles one octave apart near a comfortable C', () => {
    expect(getVoiceProfileTonicMidi(0, 'male')).toBe(48)
    expect(getVoiceProfileTonicMidi(0, 'female')).toBe(60)
    expect(getVoiceProfileTonicMidi(11, 'male')).toBe(47)
    expect(getVoiceProfileTonicMidi(11, 'female')).toBe(59)
  })
})
