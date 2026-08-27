import {
  PC_TO_SOLFEGE,
  PC_TO_LETTER,
  KEY_SCALE_LETTERS,
  EXERCISE_INTERVALS,
  NOTES,
  REGISTERS
} from './constants.js'

export const normalizePitchClass = value => ((value % 12) + 12) % 12

// Musical helper functions
export const labelForMidi = (midi, notation = 'solfege', tonicPc = 0) => {
  const pitchClass = normalizePitchClass(midi)
  const relativePitchClass = normalizePitchClass(pitchClass - tonicPc)
  return notation === 'solfege'
    ? (PC_TO_SOLFEGE[relativePitchClass] || '')
    : (KEY_SCALE_LETTERS[normalizePitchClass(tonicPc)]?.[relativePitchClass] || PC_TO_LETTER[pitchClass] || '')
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

export const getExerciseSet = (exercise, tonicMidi = NOTES.C4) => {
  const intervals = EXERCISE_INTERVALS[exercise] || EXERCISE_INTERVALS[1]
  return intervals.map(interval => tonicMidi + interval)
}

export const pickRandomTargetMidi = (exercise, tonicMidi = NOTES.C4) => {
  const set = getExerciseSet(exercise, tonicMidi)
  return set[Math.floor(Math.random() * set.length)]
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
