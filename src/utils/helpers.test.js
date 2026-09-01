import { describe, expect, it } from 'vitest'
import {
  getExerciseSet,
  getCadenceChords,
  getTonicMidi,
  getPianoRange,
  getScaleNoteNames,
  getWhiteKeys,
  hasSharpAfter,
  idsFromEvent,
  isReservedKeyId,
  labelForMidi,
  midiToNoteName,
  noteNameToFixedSolfege,
  pitchClassForNoteName,
  fromCanonicalDegreeMidi,
  toCanonicalDegreeMidi,
  loadFromStorage,
  saveToStorage
} from './helpers.js'
import { EXERCISES, SCALE_TYPES, TONALITIES, TONIC_NAMES_BY_SCALE } from './constants.js'

describe('musical helpers', () => {
  it('labels MIDI notes in solfege, letter, and scale-degree notation', () => {
    expect(labelForMidi(60, 'solfege')).toBe('do')
    expect(labelForMidi(66, 'letter')).toBe('F#')
    expect(labelForMidi(62, 'solfege', 2)).toBe('re')
    expect(labelForMidi(66, 'solfege', 2)).toBe('fa♯')
    expect(labelForMidi(65, 'letter', 1)).toBe('F')
    expect(labelForMidi(70, 'letter', 5)).toBe('Bb')
    expect(labelForMidi(72, 'solfege', 9, 'naturalMinor')).toBe('do')
    expect(labelForMidi(79, 'solfege', 9, 'naturalMinor')).toBe('sol')
    expect(labelForMidi(80, 'solfege', 9, 'harmonicMinor')).toBe('sol♯')
    expect(labelForMidi(80, 'letter', 9, 'harmonicMinor')).toBe('G#')
    expect(labelForMidi(60, 'degree', 0, 'major')).toBe('1')
    expect(labelForMidi(64, 'degree', 0, 'major')).toBe('3')
    expect(labelForMidi(66, 'degree', 2, 'major')).toBe('3')
    expect(labelForMidi(72, 'degree', 9, 'naturalMinor')).toBe('3')
    expect(labelForMidi(80, 'degree', 9, 'harmonicMinor')).toBe('7')
    expect(labelForMidi(61, 'degree', 0, 'major')).toBe('♯1')
    expect(noteNameToFixedSolfege('Bb')).toBe('si♭')
    expect(midiToNoteName(85)).toBe('C#6')
  })

  it('never labels a black piano key as an unaltered natural note', () => {
    const blackPitchClasses = new Set([1, 3, 6, 8, 10])

    for (const scaleType of Object.keys(SCALE_TYPES)) {
      for (let tonicPc = 0; tonicPc < 12; tonicPc += 1) {
        for (const midi of getExerciseSet(3, 60 + tonicPc, scaleType)) {
          const label = labelForMidi(midi, 'solfege', tonicPc, scaleType)
          if (blackPitchClasses.has(midi % 12)) expect(label).toMatch(/[♭♯]/)
        }
      }
    }

    expect(labelForMidi(70, 'solfege', 10, 'naturalMinor')).toBe('si♭')
    expect(labelForMidi(72, 'solfege', 10, 'naturalMinor')).toBe('do')
    expect(labelForMidi(73, 'solfege', 10, 'naturalMinor')).toBe('re♭')
    expect(labelForMidi(75, 'solfege', 10, 'naturalMinor')).toBe('mi♭')
  })

  it('returns a safe exercise fallback and the expected piano layout', () => {
    expect(getExerciseSet(3)).toEqual(EXERCISES[3])
    expect(getExerciseSet(99)).toEqual(EXERCISES[1])
    expect(getWhiteKeys()).toEqual([
      60, 62, 64, 65, 67, 69, 71,
      72, 74, 76, 77, 79, 81, 83, 84
    ])
    expect(hasSharpAfter(64)).toBe(false)
    expect(hasSharpAfter(65)).toBe(true)
  })

  it('transposes exercises and piano ranges across registers', () => {
    expect(getTonicMidi(2, 'low')).toBe(50)
    expect(getTonicMidi(11, 'high')).toBe(83)
    expect(getExerciseSet(3, 62)).toEqual([62, 64, 66, 67, 69, 71, 73, 74])
    expect(getWhiteKeys(61)).toEqual(getWhiteKeys(60))
    expect(getWhiteKeys(71)).toEqual(getWhiteKeys(60))
    expect(getPianoRange(71)).toEqual({ startMidi: 60, endMidi: 84 })
    expect(getWhiteKeys(72).map(midi => midi - 12)).toEqual(getWhiteKeys(60))
  })

  it('builds natural and harmonic minor scales and cadences', () => {
    expect(getExerciseSet(3, 69, 'naturalMinor')).toEqual([69, 71, 72, 74, 76, 77, 79, 81])
    expect(getExerciseSet(3, 69, 'harmonicMinor')).toEqual([69, 71, 72, 74, 76, 77, 80, 81])
    expect(getCadenceChords(69, 'naturalMinor')[2]).toEqual([67, 71, 76])
    expect(getCadenceChords(69, 'harmonicMinor')[2]).toEqual([68, 71, 76])
  })

  it('builds all Greek modes with the expected interval formulas', () => {
    const expected = {
      major: [0, 2, 4, 5, 7, 9, 11],
      naturalMinor: [0, 2, 3, 5, 7, 8, 10],
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10]
    }

    expect(Object.fromEntries(
      Object.entries(SCALE_TYPES).map(([id, scale]) => [id, scale.intervals])
    )).toEqual(expected)
  })

  it('validates the spelling and pitch of every note in all 96 tonal contexts', () => {
    expect(TONALITIES).toHaveLength(96)
    expect(new Set(TONALITIES.map(option => option.id)).size).toBe(96)

    for (const [scaleType, scale] of Object.entries(SCALE_TYPES)) {
      for (let tonicPc = 0; tonicPc < 12; tonicPc += 1) {
        const tonicName = TONIC_NAMES_BY_SCALE[scaleType][tonicPc]
        const noteNames = getScaleNoteNames(tonicPc, scaleType)
        const tonicLetterIndex = 'CDEFGAB'.indexOf(tonicName[0])

        expect(pitchClassForNoteName(tonicName)).toBe(tonicPc)
        expect(noteNames).toHaveLength(7)
        noteNames.forEach((note, degreeIndex) => {
          expect(note[0]).toBe('CDEFGAB'[(tonicLetterIndex + degreeIndex) % 7])
          expect(pitchClassForNoteName(note)).toBe((tonicPc + scale.intervals[degreeIndex]) % 12)
          expect(labelForMidi(
            60 + tonicPc + scale.intervals[degreeIndex],
            'degree',
            tonicPc,
            scaleType
          )).toBe(String(degreeIndex + 1))
        })
        expect(getExerciseSet(3, 60 + tonicPc, scaleType)).toEqual([
          ...scale.intervals.map(interval => 60 + tonicPc + interval),
          72 + tonicPc
        ])
      }
    }
  })

  it('distinguishes relative major and natural minor despite their shared notes', () => {
    const cMajorPcs = getExerciseSet(3, 60, 'major').slice(0, 7).map(midi => midi % 12).sort((a, b) => a - b)
    const aMinorPcs = getExerciseSet(3, 57, 'naturalMinor').slice(0, 7).map(midi => midi % 12).sort((a, b) => a - b)
    expect(cMajorPcs).toEqual(aMinorPcs)
    expect(getCadenceChords(60, 'major')[0]).not.toEqual(getCadenceChords(57, 'naturalMinor')[0])
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
