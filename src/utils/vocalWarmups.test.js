import { describe, expect, it } from 'vitest'
import { SCALE_TYPES } from './constants.js'
import {
  buildVocalWarmupSequence,
  DREKXEL_ROUTINE_SEGMENTS,
  getNextDrekxelSegmentId,
  getWarmupRoundCount,
  getWarmupTempo,
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

  it('reproduces the six DREKXEL blocks and restarts the tonic for each one', () => {
    const sequence = buildVocalWarmupSequence({
      warmupId: 'drekxelRoutine',
      tonicMidi: 48,
      scaleType: 'naturalMinor',
      keyCount: 1
    })

    expect(sequence).toHaveLength(36)
    expect(sequence.slice(0, 5).map(event => event.midi)).toEqual([48, 52, 55, 52, 48])
    expect(sequence.slice(5, 12).map(event => event.midi)).toEqual([48, 52, 55, 60, 55, 52, 48])
    expect(sequence.slice(12, 15).map(event => event.midi)).toEqual([48, 60, 48])
    expect(sequence.slice(15, 22).map(event => event.midi)).toEqual([48, 52, 55, 60, 55, 52, 48])
    expect(sequence.slice(22, 27).map(event => event.midi)).toEqual([48, 52, 55, 52, 48])
    expect(sequence.slice(27).map(event => event.midi)).toEqual([48, 50, 52, 53, 55, 53, 52, 50, 48])
    expect(sequence.filter(event => event.patternIndex === 0).map(event => event.segmentId)).toEqual([
      'mmmhh', 'rrrr', 'bubbles', 'bubbleGlides', 'buzz', 'puffedCheeks'
    ])
  })

  it('matches the original 9-key climb and 7-key return', () => {
    const sequence = buildVocalWarmupSequence({
      warmupId: 'drekxelRoutine',
      segmentId: 'mmmhh',
      tonicMidi: 48,
      keyCount: 9
    })

    expect(sequence.filter(event => event.patternIndex === 0).map(event => event.keyOffset)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1
    ])
    expect(getWarmupRoundCount('drekxelRoutine', 9)).toBe(16)
  })

  it('keeps the original tempo and phrase duration for every DREKXEL block', () => {
    expect(DREKXEL_ROUTINE_SEGMENTS.map(segment => (
      getWarmupTempo('drekxelRoutine', segment.id, 'original')
    ))).toEqual([120, 100, 110, 90, 120, 110])
    expect(DREKXEL_ROUTINE_SEGMENTS.map(segment => (
      segment.semitones.reduce((beats, _note, index) => (
        beats + (segment.durationBeats?.[index] ?? 1)
      ), segment.restBeats)
    ))).toEqual([8, 10, 10, 13, 8, 10])
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

  it('orders the independent DREKXEL blocks for automatic continuation', () => {
    expect(getNextDrekxelSegmentId('mmmhh')).toBe('rrrr')
    expect(getNextDrekxelSegmentId('bubbles')).toBe('bubbleGlides')
    expect(getNextDrekxelSegmentId('bubbleGlides')).toBe('buzz')
    expect(getNextDrekxelSegmentId('puffedCheeks')).toBeNull()
  })

  it('places male and female profiles one octave apart near a comfortable C', () => {
    expect(getVoiceProfileTonicMidi(0, 'male')).toBe(48)
    expect(getVoiceProfileTonicMidi(0, 'female')).toBe(60)
    expect(getVoiceProfileTonicMidi(11, 'male')).toBe(47)
    expect(getVoiceProfileTonicMidi(11, 'female')).toBe(59)
  })
})
