// Musical constants
export const NOTES = {
  C4: 60, Cs4: 61, D4: 62, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, As4: 70, B4: 71, C5: 72,
  B3: 59, G3: 55, D5: 74
}

export const PC_TO_SOLFEGE = { 
  0: 'do', 1: 'do#', 2: 're', 3: 're#', 4: 'mi', 5: 'fa', 6: 'fa#', 7: 'sol', 8: 'sol#', 9: 'la', 10: 'la#', 11: 'si' 
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

// Exercise definitions
export const EXERCISE_INTERVALS = {
  1: [0, 2, 4, 5],
  2: [7, 9, 11, 12],
  3: [0, 2, 4, 5, 7, 9, 11, 12]
}

// Kept as the default C4 exercise sets for backwards compatibility.
export const EXERCISES = Object.fromEntries(
  Object.entries(EXERCISE_INTERVALS).map(([exercise, intervals]) => [
    exercise,
    intervals.map(interval => NOTES.C4 + interval)
  ])
)

export const TONALITIES = [
  { value: 0, label: 'C major', shortLabel: 'C' },
  { value: 1, label: 'D♭ major', shortLabel: 'D♭' },
  { value: 2, label: 'D major', shortLabel: 'D' },
  { value: 3, label: 'E♭ major', shortLabel: 'E♭' },
  { value: 4, label: 'E major', shortLabel: 'E' },
  { value: 5, label: 'F major', shortLabel: 'F' },
  { value: 6, label: 'F♯ major', shortLabel: 'F♯' },
  { value: 7, label: 'G major', shortLabel: 'G' },
  { value: 8, label: 'A♭ major', shortLabel: 'A♭' },
  { value: 9, label: 'A major', shortLabel: 'A' },
  { value: 10, label: 'B♭ major', shortLabel: 'B♭' },
  { value: 11, label: 'B major', shortLabel: 'B' }
]

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
  REGISTER: 'fet-register',
  KEYMAP: 'fet-keymap',
  STATS: 'fet-stats'
}
