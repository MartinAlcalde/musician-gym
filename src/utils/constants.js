// Musical constants
export const NOTES = {
  C4: 60, Cs4: 61, D4: 62, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, As4: 70, B4: 71, C5: 72,
  B3: 59, G3: 55, D5: 74
}

export const MIDI_TO_NAME = { 
  55: "G3", 59: "B3", 60: "C4", 61: "C#4", 62: "D4", 63: "D#4", 64: "E4", 65: "F4", 66: "F#4", 67: "G4", 68: "G#4", 69: "A4", 70: "A#4", 71: "B4", 72: "C5", 74: "D5" 
}

export const PC_TO_SOLFEGE = { 
  0: 'do', 1: 'do#', 2: 're', 3: 're#', 4: 'mi', 5: 'fa', 6: 'fa#', 7: 'sol', 8: 'sol#', 9: 'la', 10: 'la#', 11: 'si' 
}

export const PC_TO_LETTER = { 
  0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' 
}

// Exercise definitions
export const EXERCISES = {
  1: [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4],
  2: [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5],
  3: [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5]
}

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
  NOTATION: 'fet-notation',
  DARK_THEME: 'fet-dark-theme',
  AUTO_MODE: 'fet-auto-mode',
  AUTO_INTERVAL: 'fet-auto-interval',
  SHOW_ANSWER: 'fet-show-answer',
  SAY_ANSWER: 'fet-say-answer',
  KEYMAP: 'fet-keymap'
}