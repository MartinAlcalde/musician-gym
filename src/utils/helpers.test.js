import { describe, expect, it } from 'vitest'
import {
  getExerciseSet,
  getWhiteKeys,
  hasSharpAfter,
  idsFromEvent,
  isReservedKeyId,
  labelForMidi,
  loadFromStorage,
  saveToStorage
} from './helpers.js'
import { EXERCISES } from './constants.js'

describe('musical helpers', () => {
  it('labels MIDI notes in solfege and letter notation', () => {
    expect(labelForMidi(60, 'solfege')).toBe('do')
    expect(labelForMidi(66, 'letter')).toBe('F#')
  })

  it('returns a safe exercise fallback and the expected piano layout', () => {
    expect(getExerciseSet(3)).toEqual(EXERCISES[3])
    expect(getExerciseSet(99)).toEqual(EXERCISES[1])
    expect(getWhiteKeys()).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(hasSharpAfter(64)).toBe(false)
    expect(hasSharpAfter(65)).toBe(true)
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
