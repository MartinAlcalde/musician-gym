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

export const SCALE_TYPES = {
  major: {
    id: 'major', label: 'Major · Ionian', shortLabel: 'Ion',
    description: 'Major color with a stable tonic.',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'],
    cadence: [[0, 4, 7], [0, 5, 9], [-1, 2, 7], [0, 4, 7]],
    cadenceLabel: 'I–IV–V–I'
  },
  naturalMinor: {
    id: 'naturalMinor', label: 'Natural minor · Aeolian', shortLabel: 'Aeo',
    description: 'Minor color with lowered 3rd, 6th, and 7th degrees.',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    solfege: ['do', 're', 'mi♭', 'fa', 'sol', 'la♭', 'si♭'],
    cadence: [[0, 3, 7], [0, 5, 8], [-2, 2, 7], [0, 3, 7]],
    cadenceLabel: 'i–iv–v–i'
  },
  harmonicMinor: {
    id: 'harmonicMinor', label: 'Harmonic minor', shortLabel: 'Harm',
    description: 'Natural minor with a raised 7th for stronger tension toward the tonic.',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    solfege: ['do', 're', 'mi♭', 'fa', 'sol', 'la♭', 'si'],
    cadence: [[0, 3, 7], [0, 5, 8], [-1, 2, 7], [0, 3, 7]],
    cadenceLabel: 'i–iv–V–i'
  },
  dorian: {
    id: 'dorian', label: 'Dorian', shortLabel: 'Dor',
    description: 'Minor mode with a characteristic raised 6th.',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    solfege: ['do', 're', 'mi♭', 'fa', 'sol', 'la', 'si♭'],
    cadence: [[0, 3, 7], [0, 5, 9], [-2, 2, 5], [0, 3, 7]],
    cadenceLabel: 'i–IV–♭VII–i'
  },
  phrygian: {
    id: 'phrygian', label: 'Phrygian', shortLabel: 'Phr',
    description: 'Minor mode defined by its lowered 2nd.',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    solfege: ['do', 're♭', 'mi♭', 'fa', 'sol', 'la♭', 'si♭'],
    cadence: [[0, 3, 7], [1, 5, 8], [-2, 1, 5], [0, 3, 7]],
    cadenceLabel: 'i–♭II–♭vii–i'
  },
  lydian: {
    id: 'lydian', label: 'Lydian', shortLabel: 'Lyd',
    description: 'Major mode with a bright raised 4th.',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    solfege: ['do', 're', 'mi', 'fa♯', 'sol', 'la', 'si'],
    cadence: [[0, 4, 7], [2, 6, 9], [-1, 2, 6], [0, 4, 7]],
    cadenceLabel: 'I–II–vii–I'
  },
  mixolydian: {
    id: 'mixolydian', label: 'Mixolydian', shortLabel: 'Mix',
    description: 'Major mode with a relaxed lowered 7th.',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si♭'],
    cadence: [[0, 4, 7], [-2, 2, 5], [0, 5, 9], [0, 4, 7]],
    cadenceLabel: 'I–♭VII–IV–I'
  },
  locrian: {
    id: 'locrian', label: 'Locrian', shortLabel: 'Loc',
    description: 'Unstable minor mode with a lowered 2nd and 5th.',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    solfege: ['do', 're♭', 'mi♭', 'fa', 'sol♭', 'la♭', 'si♭'],
    cadence: [[0, 3, 6], [1, 5, 8], [1, 6, 10], [0, 3, 6]],
    cadenceLabel: 'i°–♭II–♭V–i°'
  }
}

export const SCALE_TYPE_GROUPS = [
  { label: 'Common scales', ids: ['major', 'naturalMinor', 'harmonicMinor'] },
  { label: 'Greek modes', ids: ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'] }
]

const buildExerciseIntervals = intervals => ({
  1: intervals.slice(0, 4),
  2: [...intervals.slice(4), 12],
  3: [...intervals, 12]
})

export const SCALE_EXERCISE_INTERVALS = Object.fromEntries(
  Object.values(SCALE_TYPES).map(scale => [scale.id, buildExerciseIntervals(scale.intervals)])
)

export const EXERCISE_INTERVALS = SCALE_EXERCISE_INTERVALS.major

export const SCALE_SOLFEGE = Object.fromEntries(
  Object.values(SCALE_TYPES).map(scale => [
    scale.id,
    Object.fromEntries(scale.intervals.map((interval, index) => [interval, scale.solfege[index]]))
  ])
)

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NATURAL_NOTE_PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const TONIC_CANDIDATES = [
  ['C', 'B#'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E', 'Fb'], ['F', 'E#'],
  ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B', 'Cb']
]

const normalizePitchClass = value => ((value % 12) + 12) % 12
const accidentalValue = note => [...note.slice(1)].reduce((total, symbol) => (
  total + (symbol === '#' ? 1 : -1)
), 0)

const spellScaleFromTonic = (tonicName, tonicPc, intervals) => {
  const tonicLetterIndex = LETTERS.indexOf(tonicName[0])
  return intervals.map((interval, degreeIndex) => {
    const letter = LETTERS[(tonicLetterIndex + degreeIndex) % LETTERS.length]
    const targetPc = normalizePitchClass(tonicPc + interval)
    let accidental = normalizePitchClass(targetPc - NATURAL_NOTE_PCS[letter])
    if (accidental > 6) accidental -= 12
    const suffix = accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental)
    return `${letter}${suffix}`
  })
}

const spellingScore = notes => notes.reduce((score, note) => {
  const count = Math.abs(accidentalValue(note))
  return score + count + Math.max(0, count - 1) * 5
}, 0)

const chooseScaleSpelling = (tonicPc, intervals) => {
  return TONIC_CANDIDATES[tonicPc]
    .map(tonicName => ({
      tonicName,
      notes: spellScaleFromTonic(tonicName, tonicPc, intervals)
    }))
    .sort((left, right) => spellingScore(left.notes) - spellingScore(right.notes))[0]
}

export const SCALE_LETTERS = {}
export const TONIC_NAMES_BY_SCALE = {}

Object.values(SCALE_TYPES).forEach(scale => {
  SCALE_LETTERS[scale.id] = {}
  TONIC_NAMES_BY_SCALE[scale.id] = []
  for (let tonicPc = 0; tonicPc < 12; tonicPc += 1) {
    const spelling = chooseScaleSpelling(tonicPc, scale.intervals)
    TONIC_NAMES_BY_SCALE[scale.id][tonicPc] = spelling.tonicName
    SCALE_LETTERS[scale.id][tonicPc] = Object.fromEntries(
      scale.intervals.map((interval, index) => [interval, spelling.notes[index]])
    )
  }
})

// Kept as the default C4 exercise sets for backwards compatibility.
export const EXERCISES = Object.fromEntries(
  Object.entries(EXERCISE_INTERVALS).map(([exercise, intervals]) => [
    exercise,
    intervals.map(interval => NOTES.C4 + interval)
  ])
)

const displayNoteName = note => note.replaceAll('b', '♭').replaceAll('#', '♯')

export const TONALITIES = Object.values(SCALE_TYPES).flatMap(scale => {
  return TONIC_NAMES_BY_SCALE[scale.id].map((tonicName, value) => ({
    id: `${scale.id}:${value}`,
    value,
    scaleType: scale.id,
    groupLabel: scale.label,
    label: `${displayNoteName(tonicName)} ${scale.label}`,
    shortLabel: `${displayNoteName(tonicName)} ${scale.shortLabel}`
  }))
})

export const REGISTERS = {
  low: { id: 'low', label: 'Low', baseMidi: 48 },
  middle: { id: 'middle', label: 'Middle', baseMidi: 60 },
  high: { id: 'high', label: 'High', baseMidi: 72 }
}

export const REGISTER_OPTIONS = Object.values(REGISTERS)

export const NOTATION_OPTIONS = ['solfege', 'letter', 'degree']

export const INSTRUMENTS = {
  piano: { id: 'piano' },
  guitar: { id: 'guitar' }
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
  INSTRUMENT: 'fet-instrument',
  LANGUAGE: 'musician-gym-language',
  KEYMAP: 'fet-keymap',
  STATS: 'fet-stats'
}
