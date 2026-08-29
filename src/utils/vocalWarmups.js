import { SCALE_TYPES } from './constants.js'

export const DREKXEL_ROUTINE_SEGMENTS = [
  { id: 'mmmhh', semitones: [0, 4, 7, 4, 0] },
  { id: 'rrrr', semitones: [0, 4, 7, 12, 7, 4, 0] },
  { id: 'bubbles', semitones: [0, 12, 0] },
  { id: 'buzz', semitones: [0, 4, 7, 4, 0] },
  { id: 'puffedCheeks', semitones: [0, 2, 4, 5, 7, 5, 4, 2, 0] }
]

export const VOCAL_WARMUPS = [
  {
    id: 'fiveTone',
    label: 'Five-note scale',
    description: 'A gentle start for breath flow and an even tone.',
    syllable: 'Ma',
    degrees: [0, 1, 2, 3, 4, 3, 2, 1, 0]
  },
  {
    id: 'arpeggio',
    label: 'Arpeggio and octave',
    description: 'Builds clean jumps and connection across the register.',
    syllable: 'No',
    degrees: [0, 2, 4, 7, 4, 2, 0]
  },
  {
    id: 'fullScale',
    label: 'Full scale',
    description: 'Practise every note of the selected scale or mode.',
    syllable: 'La',
    degrees: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0]
  },
  {
    id: 'drekxelRoutine',
    label: 'DREKXEL routine',
    description: 'Five adapted blocks for articulation, resonance, and airflow.',
    syllable: 'M · R · BRR · DZZZ · B',
    segments: DREKXEL_ROUTINE_SEGMENTS
  }
]

export const WARMUP_TEMPOS = [
  { value: 60, label: '60 BPM · Slow' },
  { value: 72, label: '72 BPM · Comfortable' },
  { value: 88, label: '88 BPM · Flowing' },
  { value: 104, label: '104 BPM · Quick' }
]

export const WARMUP_KEY_COUNTS = [3, 5, 8]

export const VOICE_PROFILES = {
  male: { id: 'male', anchorMidi: 48 },
  female: { id: 'female', anchorMidi: 60 }
}

export const getVoiceProfileTonicMidi = (tonicPc = 0, profileId = 'male') => {
  const profile = VOICE_PROFILES[profileId] || VOICE_PROFILES.male
  const safePitchClass = ((Number(tonicPc) % 12) + 12) % 12
  const anchorOctave = Math.floor(profile.anchorMidi / 12)
  return [anchorOctave - 1, anchorOctave, anchorOctave + 1]
    .map(octave => octave * 12 + safePitchClass)
    .sort((left, right) => Math.abs(left - profile.anchorMidi) - Math.abs(right - profile.anchorMidi))[0]
}

export const buildVocalWarmupSequence = ({
  warmupId = 'fiveTone',
  tonicMidi = 60,
  scaleType = 'major',
  keyCount = 5,
  segmentId
} = {}) => {
  const warmup = VOCAL_WARMUPS.find(option => option.id === warmupId) || VOCAL_WARMUPS[0]
  const scale = SCALE_TYPES[scaleType] || SCALE_TYPES.major
  const scaleWithOctave = [...scale.intervals, 12]
  const safeKeyCount = Math.max(1, Math.min(12, Math.round(Number(keyCount) || 1)))
  const allSegments = warmup.segments || [{ id: null, degrees: warmup.degrees }]
  const requestedSegment = segmentId
    ? allSegments.find(segment => segment.id === segmentId)
    : null
  const segments = requestedSegment ? [requestedSegment] : allSegments

  return segments.flatMap(segment => {
    const segmentIndex = warmup.segments ? warmup.segments.indexOf(segment) : 0
    return Array.from({ length: safeKeyCount }, (_, cycleIndex) => {
      const cycleTonicMidi = tonicMidi + cycleIndex
      const pattern = segment.semitones || segment.degrees
      return pattern.map((value, patternIndex) => ({
        midi: cycleTonicMidi + (segment.semitones ? value : scaleWithOctave[value]),
        degree: segment.semitones ? null : value,
        patternIndex,
        cycleIndex,
        cycleTonicMidi,
        segmentId: segment.id,
        segmentIndex
      }))
    }).flat()
  })
}
