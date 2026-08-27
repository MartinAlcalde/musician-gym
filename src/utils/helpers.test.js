import { describe, expect, it } from 'vitest'
import {
  getExerciseSet,
  getTonicMidi,
  getWhiteKeys,
  hasSharpAfter,
  idsFromEvent,
  isReservedKeyId,
  labelForMidi,
  midiToNoteName,
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
