import {
  PC_TO_SOLFEGE,
  PC_TO_LETTER,
  SCALE_LETTERS,
  SCALE_TYPES,
  TONIC_NAMES_BY_SCALE,
  EXERCISE_INTERVALS,
  SCALE_EXERCISE_INTERVALS,
  NOTES,
  REGISTERS
} from './constants.js'

export const normalizePitchClass = value => ((value % 12) + 12) % 12

export const displayNoteName = note => note.replaceAll('b', '♭').replaceAll('#', '♯')

const SOLFEGE_BY_LETTER = {
  C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si'
}

export const noteNameToFixedSolfege = note => {
  const match = /^([A-G])([#b]*)$/.exec(note)
  if (!match) return ''
  return `${SOLFEGE_BY_LETTER[match[1]]}${displayNoteName(match[2])}`
}

// Musical helper functions
const safeScaleType = scaleType => (
  SCALE_EXERCISE_INTERVALS[scaleType] ? scaleType : 'major'
)

export const getTonicName = (tonicPc = 0, scaleType = 'major') => {
  const selectedScaleType = safeScaleType(scaleType)
  return TONIC_NAMES_BY_SCALE[selectedScaleType][normalizePitchClass(tonicPc)]
}

export const getTonalityLabel = (tonicPc = 0, scaleType = 'major') => {
  const selectedScaleType = safeScaleType(scaleType)
  return `${displayNoteName(getTonicName(tonicPc, selectedScaleType))} ${SCALE_TYPES[selectedScaleType].label}`
}

export const getScaleNoteNames = (tonicPc = 0, scaleType = 'major') => {
  const selectedScaleType = safeScaleType(scaleType)
  const safeTonicPc = normalizePitchClass(tonicPc)
  return SCALE_TYPES[selectedScaleType].intervals.map(interval => (
    SCALE_LETTERS[selectedScaleType][safeTonicPc][interval]
  ))
}

export const pitchClassForNoteName = note => {
  if (!/^[A-G](?:#{1,2}|b{1,2})?$/.test(note)) return null
  const naturalPitchClasses = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const accidentalOffset = [...note.slice(1)].reduce((total, accidental) => (
    total + (accidental === '#' ? 1 : -1)
  ), 0)
  return normalizePitchClass(naturalPitchClasses[note[0]] + accidentalOffset)
}

export const labelForMidi = (midi, notation = 'solfege', tonicPc = 0, scaleType = 'major') => {
  const pitchClass = normalizePitchClass(midi)
  const relativePitchClass = normalizePitchClass(pitchClass - tonicPc)
  const selectedScaleType = safeScaleType(scaleType)
  const scaleNoteName = SCALE_LETTERS[selectedScaleType]?.[normalizePitchClass(tonicPc)]?.[relativePitchClass]
  return notation === 'solfege'
    ? (noteNameToFixedSolfege(scaleNoteName) || displayNoteName(PC_TO_SOLFEGE[pitchClass] || ''))
    : (scaleNoteName || PC_TO_LETTER[pitchClass] || '')
}

export const midiToNoteName = midi => {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) return ''
  const pitchClass = normalizePitchClass(midi)
  const octave = Math.floor(midi / 12) - 1
  return `${PC_TO_LETTER[pitchClass]}${octave}`
}

export const getTonicMidi = (tonicPc = 0, register = 'middle') => {
  const safePitchClass = Number.isInteger(tonicPc) && tonicPc >= 0 && tonicPc <= 11
    ? tonicPc
    : 0
  const baseMidi = REGISTERS[register]?.baseMidi ?? REGISTERS.middle.baseMidi
  return baseMidi + safePitchClass
}

export const getExerciseSet = (exercise, tonicMidi = NOTES.C4, scaleType = 'major') => {
  const exerciseIntervals = SCALE_EXERCISE_INTERVALS[safeScaleType(scaleType)]
  const intervals = exerciseIntervals[exercise] || exerciseIntervals[1]
  return intervals.map(interval => tonicMidi + interval)
}

export const pickRandomTargetMidi = (exercise, tonicMidi = NOTES.C4, scaleType = 'major') => {
  const set = getExerciseSet(exercise, tonicMidi, scaleType)
  return set[Math.floor(Math.random() * set.length)]
}

export const toCanonicalDegreeMidi = (midi, tonicMidi, scaleType = 'major') => {
  const scaleIntervals = SCALE_EXERCISE_INTERVALS[safeScaleType(scaleType)][3]
  const degreeIndex = scaleIntervals.indexOf(midi - tonicMidi)
  return degreeIndex === -1 ? null : NOTES.C4 + EXERCISE_INTERVALS[3][degreeIndex]
}

export const fromCanonicalDegreeMidi = (canonicalMidi, tonicMidi, scaleType = 'major') => {
  const degreeIndex = EXERCISE_INTERVALS[3].indexOf(canonicalMidi - NOTES.C4)
  if (degreeIndex === -1) return null
  return tonicMidi + SCALE_EXERCISE_INTERVALS[safeScaleType(scaleType)][3][degreeIndex]
}

export const getCadenceChords = (tonicMidi, scaleType = 'major') => {
  return SCALE_TYPES[safeScaleType(scaleType)].cadence.map(chord => (
    chord.map(interval => tonicMidi + interval)
  ))
}

// Piano layout helpers
export const hasSharpAfter = (midi) => {
  const pc = midi % 12
  return pc === 0 || pc === 2 || pc === 5 || pc === 7 || pc === 9
}

const isWhiteKey = midi => [0, 2, 4, 5, 7, 9, 11].includes(normalizePitchClass(midi))

export const getWhiteKeys = (tonicMidi = NOTES.C4) => {
  let firstWhite = tonicMidi
  while (!isWhiteKey(firstWhite)) firstWhite -= 1

  let lastWhite = tonicMidi + 12
  while (!isWhiteKey(lastWhite)) lastWhite += 1

  const whiteKeys = []
  for (let midi = firstWhite; midi <= lastWhite; midi += 1) {
    if (isWhiteKey(midi)) whiteKeys.push(midi)
  }
  return whiteKeys
}

// Keyboard mapping helpers
export const idsFromEvent = (e) => {
  const ids = []
  if (!e) return ids
  
  const k = (e.key || '').toString().toLowerCase()
  const c = (e.code || '').toString().toLowerCase()
  
  if (k && k !== 'unidentified' && k !== 'undefined') {
    ids.push(k)
    ids.push(`key:${k}`)
  }
  if (c && c !== 'unidentified' && c !== 'undefined') {
    ids.push(`code:${c}`)
  }
  
  return ids.filter(id => id && typeof id === 'string')
}

export const isReservedKeyId = (id) => {
  if (!id || typeof id !== 'string') return false
  const v = id.replace(/^key:|^code:/i, '').toLowerCase()
  return ['escape', 'shift', 'control', 'alt', 'meta', 'tab'].includes(v)
}

// Local storage helpers
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return defaultValue
  }
}

// DOM helpers
export const flashKey = (element, className, duration = 250) => {
  if (!element) return
  element.classList.add('active', className)
  setTimeout(() => {
    element.classList.remove('active', className)
  }, duration)
}
