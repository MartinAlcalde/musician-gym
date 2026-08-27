// Musical constants
export const NOTES = {
  C4: 60, Cs4: 61, D4: 62, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, As4: 70, B4: 71, C5: 72,
  B3: 59, G3: 55, D5: 74
}

export const PC_TO_SOLFEGE = { 
  0: 'do', 1: 'do#', 2: 're', 3: 're#', 4: 'mi', 5: 'fa', 6: 'fa#', 7: 'sol', 8: 'sol#', 9: 'la', 10: 'la#', 11: 'si' 
}

export const SCALE_SOLFEGE = {
  major: { 0: 'do', 2: 're', 4: 'mi', 5: 'fa', 7: 'sol', 9: 'la', 11: 'si' },
  naturalMinor: { 0: 'do', 2: 're', 3: 'mi♭', 5: 'fa', 7: 'sol', 8: 'la♭', 10: 'si♭' },
  harmonicMinor: { 0: 'do', 2: 're', 3: 'mi♭', 5: 'fa', 7: 'sol', 8: 'la♭', 11: 'si' }
}

export const PC_TO_LETTER = { 
  0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' 
}

export const KEY_SCALE_LETTERS = {
  0: { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' },
  1: { 0: 'Db', 2: 'Eb', 4: 'F', 5: 'Gb', 7: 'Ab', 9: 'Bb', 11: 'C' },
  2: { 0: 'D', 2: 'E', 4: 'F#', 5: 'G', 7: 'A', 9: 'B', 11: 'C#' },
  3: { 0: 'Eb', 2: 'F', 4: 'G', 5: 'Ab', 7: 'Bb', 9: 'C', 11: 'D' },
  4: { 0: 'E', 2: 'F#', 4: 'G#', 5: 'A', 7: 'B', 9: 'C#', 11: 'D#' },
  5: { 0: 'F', 2: 'G', 4: 'A', 5: 'Bb', 7: 'C', 9: 'D', 11: 'E' },
  6: { 0: 'F#', 2: 'G#', 4: 'A#', 5: 'B', 7: 'C#', 9: 'D#', 11: 'E#' },
  7: { 0: 'G', 2: 'A', 4: 'B', 5: 'C', 7: 'D', 9: 'E', 11: 'F#' },
  8: { 0: 'Ab', 2: 'Bb', 4: 'C', 5: 'Db', 7: 'Eb', 9: 'F', 11: 'G' },
  9: { 0: 'A', 2: 'B', 4: 'C#', 5: 'D', 7: 'E', 9: 'F#', 11: 'G#' },
  10: { 0: 'Bb', 2: 'C', 4: 'D', 5: 'Eb', 7: 'F', 9: 'G', 11: 'A' },
  11: { 0: 'B', 2: 'C#', 4: 'D#', 5: 'E', 7: 'F#', 9: 'G#', 11: 'A#' }
}

export const NATURAL_MINOR_SCALE_LETTERS = {
  0: { 0: 'C', 2: 'D', 3: 'Eb', 5: 'F', 7: 'G', 8: 'Ab', 10: 'Bb' },
  1: { 0: 'C#', 2: 'D#', 3: 'E', 5: 'F#', 7: 'G#', 8: 'A', 10: 'B' },
  2: { 0: 'D', 2: 'E', 3: 'F', 5: 'G', 7: 'A', 8: 'Bb', 10: 'C' },
  3: { 0: 'Eb', 2: 'F', 3: 'Gb', 5: 'Ab', 7: 'Bb', 8: 'Cb', 10: 'Db' },
  4: { 0: 'E', 2: 'F#', 3: 'G', 5: 'A', 7: 'B', 8: 'C', 10: 'D' },
  5: { 0: 'F', 2: 'G', 3: 'Ab', 5: 'Bb', 7: 'C', 8: 'Db', 10: 'Eb' },
  6: { 0: 'F#', 2: 'G#', 3: 'A', 5: 'B', 7: 'C#', 8: 'D', 10: 'E' },
  7: { 0: 'G', 2: 'A', 3: 'Bb', 5: 'C', 7: 'D', 8: 'Eb', 10: 'F' },
  8: { 0: 'G#', 2: 'A#', 3: 'B', 5: 'C#', 7: 'D#', 8: 'E', 10: 'F#' },
  9: { 0: 'A', 2: 'B', 3: 'C', 5: 'D', 7: 'E', 8: 'F', 10: 'G' },
  10: { 0: 'Bb', 2: 'C', 3: 'Db', 5: 'Eb', 7: 'F', 8: 'Gb', 10: 'Ab' },
  11: { 0: 'B', 2: 'C#', 3: 'D', 5: 'E', 7: 'F#', 8: 'G', 10: 'A' }
}

const HARMONIC_MINOR_LEADING_TONES = [
  'B', 'B#', 'C#', 'D', 'D#', 'E', 'E#', 'F#', 'F##', 'G#', 'A', 'A#'
]

export const HARMONIC_MINOR_SCALE_LETTERS = Object.fromEntries(
  Object.entries(NATURAL_MINOR_SCALE_LETTERS).map(([tonicPc, notes]) => [
    tonicPc,
    { ...notes, 11: HARMONIC_MINOR_LEADING_TONES[Number(tonicPc)] }
  ])
)

export const SCALE_LETTERS = {
  major: KEY_SCALE_LETTERS,
  naturalMinor: NATURAL_MINOR_SCALE_LETTERS,
  harmonicMinor: HARMONIC_MINOR_SCALE_LETTERS
}

// Exercise definitions
export const EXERCISE_INTERVALS = {
  1: [0, 2, 4, 5],
  2: [7, 9, 11, 12],
  3: [0, 2, 4, 5, 7, 9, 11, 12]
}

export const SCALE_EXERCISE_INTERVALS = {
  major: EXERCISE_INTERVALS,
  naturalMinor: {
    1: [0, 2, 3, 5],
    2: [7, 8, 10, 12],
    3: [0, 2, 3, 5, 7, 8, 10, 12]
  },
  harmonicMinor: {
    1: [0, 2, 3, 5],
    2: [7, 8, 11, 12],
    3: [0, 2, 3, 5, 7, 8, 11, 12]
  }
}

export const SCALE_TYPES = {
  major: { id: 'major', label: 'Major', optionLabel: 'major', shortLabel: '' },
  naturalMinor: { id: 'naturalMinor', label: 'Natural minor', optionLabel: 'natural minor', shortLabel: 'nat' },
  harmonicMinor: { id: 'harmonicMinor', label: 'Harmonic minor', optionLabel: 'harmonic minor', shortLabel: 'harm' }
}

// Kept as the default C4 exercise sets for backwards compatibility.
export const EXERCISES = Object.fromEntries(
  Object.entries(EXERCISE_INTERVALS).map(([exercise, intervals]) => [
    exercise,
    intervals.map(interval => NOTES.C4 + interval)
  ])
)

const MAJOR_TONIC_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const MINOR_TONIC_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B']

export const TONALITIES = Object.values(SCALE_TYPES).flatMap(scale => {
  const tonicNames = scale.id === 'major' ? MAJOR_TONIC_NAMES : MINOR_TONIC_NAMES
  return tonicNames.map((tonicName, value) => ({
    id: `${scale.id}:${value}`,
    value,
    scaleType: scale.id,
    groupLabel: scale.label,
    label: `${tonicName} ${scale.optionLabel}`,
    shortLabel: scale.shortLabel ? `${tonicName} ${scale.shortLabel}` : tonicName
  }))
})

export const REGISTERS = {
  low: { id: 'low', label: 'Low', baseMidi: 48 },
  middle: { id: 'middle', label: 'Middle', baseMidi: 60 },
  high: { id: 'high', label: 'High', baseMidi: 72 }
}

export const REGISTER_OPTIONS = Object.values(REGISTERS)

// Auto mode intervals
export const AUTO_INTERVALS = {
  3000: '3 seconds',
  5000: '5 seconds',
  8000: '8 seconds',
  10000: '10 seconds',
  15000: '15 seconds'
}

// Local storage keys
export const STORAGE_KEYS = {
  RESOLVE: 'fet-resolve',
  NOTATION: 'fet-notation',
  DARK_THEME: 'fet-dark-theme',
  AUTO_MODE: 'fet-auto-mode',
  AUTO_INTERVAL: 'fet-auto-interval',
  SHOW_ANSWER: 'fet-show-answer',
  SAY_ANSWER: 'fet-say-answer',
  TONIC_PC: 'fet-tonic-pc',
  SCALE_TYPE: 'fet-scale-type',
  REGISTER: 'fet-register',
  KEYMAP: 'fet-keymap',
  STATS: 'fet-stats'
}
