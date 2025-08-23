import { PC_TO_SOLFEGE, PC_TO_LETTER, EXERCISES } from './constants.js'

// Musical helper functions
export const labelForMidi = (midi, notation = 'solfege') => {
  const pc = midi % 12
  return notation === 'solfege' ? (PC_TO_SOLFEGE[pc] || '') : (PC_TO_LETTER[pc] || '')
}

export const getExerciseSet = (exercise) => {
  return EXERCISES[exercise] || EXERCISES[1]
}

export const pickRandomTargetMidi = (exercise) => {
  const set = getExerciseSet(exercise)
  return set[Math.floor(Math.random() * set.length)]
}

// Piano layout helpers
export const hasSharpAfter = (midi) => {
  const pc = midi % 12
  return pc === 0 || pc === 2 || pc === 5 || pc === 7 || pc === 9
}

export const getWhiteKeys = () => {
  return [60, 62, 64, 65, 67, 69, 71, 72] // C4 to C5
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
  const v = id.replace(/^key:|^code:/, '')
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