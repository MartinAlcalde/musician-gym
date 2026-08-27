import { describe, expect, it } from 'vitest'
import {
  getExerciseSet,
  getCadenceChords,
  getTonicMidi,
  getWhiteKeys,
  hasSharpAfter,
  idsFromEvent,
  isReservedKeyId,
  labelForMidi,
  midiToNoteName,
  fromCanonicalDegreeMidi,
  toCanonicalDegreeMidi,
  loadFromStorage,
  saveToStorage
} from './helpers.js'
import { EXERCISES } from './constants.js'

describe('musical helpers', () => {
  it('labels MIDI notes in solfege and letter notation', () => {
    expect(labelForMidi(60, 'solfege')).toBe('do')
    expect(labelForMidi(66, 'letter')).toBe('F#')
    expect(labelForMidi(62, 'solfege', 2)).toBe('do')
    expect(labelForMidi(66, 'solfege', 2)).toBe('mi')
    expect(labelForMidi(65, 'letter', 1)).toBe('F')
    expect(labelForMidi(70, 'letter', 5)).toBe('Bb')
    expect(labelForMidi(72, 'solfege', 9, 'naturalMinor')).toBe('mi♭')
    expect(labelForMidi(79, 'solfege', 9, 'naturalMinor')).toBe('si♭')
    expect(labelForMidi(80, 'solfege', 9, 'harmonicMinor')).toBe('si')
    expect(labelForMidi(80, 'letter', 9, 'harmonicMinor')).toBe('G#')
    expect(midiToNoteName(85)).toBe('C#6')
  })

  it('returns a safe exercise fallback and the expected piano layout', () => {
    expect(getExerciseSet(3)).toEqual(EXERCISES[3])
    expect(getExerciseSet(99)).toEqual(EXERCISES[1])
    expect(getWhiteKeys()).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(hasSharpAfter(64)).toBe(false)
    expect(hasSharpAfter(65)).toBe(true)
  })

  it('transposes exercises and piano ranges across registers', () => {
    expect(getTonicMidi(2, 'low')).toBe(50)
    expect(getTonicMidi(11, 'high')).toBe(83)
    expect(getExerciseSet(3, 62)).toEqual([62, 64, 66, 67, 69, 71, 73, 74])
    expect(getWhiteKeys(61)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74])
  })

  it('builds natural and harmonic minor scales and cadences', () => {
    expect(getExerciseSet(3, 69, 'naturalMinor')).toEqual([69, 71, 72, 74, 76, 77, 79, 81])
    expect(getExerciseSet(3, 69, 'harmonicMinor')).toEqual([69, 71, 72, 74, 76, 77, 80, 81])
    expect(getCadenceChords(69, 'naturalMinor')[2]).toEqual([67, 71, 76])
    expect(getCadenceChords(69, 'harmonicMinor')[2]).toEqual([68, 71, 76])
  })

  it('keeps key mappings attached to scale degrees across scale types', () => {
    expect(toCanonicalDegreeMidi(72, 69, 'naturalMinor')).toBe(64)
    expect(fromCanonicalDegreeMidi(64, 69, 'naturalMinor')).toBe(72)
    expect(fromCanonicalDegreeMidi(71, 69, 'harmonicMinor')).toBe(80)
  })
})

describe('input and storage helpers', () => {
  it('normalizes keyboard identifiers and reserved keys', () => {
    expect(idsFromEvent({ key: 'A', code: 'KeyA' })).toEqual([
      'a',
      'key:a',
      'code:keya'
    ])
    expect(isReservedKeyId('code:Escape')).toBe(true)
    expect(isReservedKeyId('key:a')).toBe(false)
  })

  it('round-trips JSON values through localStorage', () => {
    saveToStorage('test-value', { ok: true })
    expect(loadFromStorage('test-value')).toEqual({ ok: true })
    expect(loadFromStorage('missing', 'fallback')).toBe('fallback')
  })
})
