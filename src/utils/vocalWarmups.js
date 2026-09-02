import { SCALE_TYPES } from './constants.js'

export const DREKXEL_ROUTINE_SEGMENTS = [
  { id: 'mmmhh', semitones: [0, 4, 7, 4, 0], tempo: 120, restBeats: 3 },
  { id: 'rrrr', semitones: [0, 4, 7, 12, 7, 4, 0], tempo: 100, restBeats: 3 },
  {
    id: 'bubbles',
    semitones: [0, 12, 0],
    durationBeats: [2, 4, 2],
    tempo: 110,
    restBeats: 2
  },
  {
    id: 'bubbleGlides',
    semitones: [0, 4, 7, 12, 7, 4, 0],
    durationBeats: [1, 1, 1, 2, 1, 1, 1],
    tempo: 90,
    restBeats: 5
  },
  { id: 'buzz', semitones: [0, 4, 7, 4, 0], tempo: 120, restBeats: 3 },
  {
    id: 'puffedCheeks',
    semitones: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    tempo: 110,
    restBeats: 1
  }
]

export const DEFAULT_WARMUP_TEMPO = 120
export const DEFAULT_WARMUP_KEY_COUNT = 5
export const DEFAULT_DREKXEL_KEY_COUNT = 9

export const getNextDrekxelSegmentId = segmentId => {
  const currentIndex = DREKXEL_ROUTINE_SEGMENTS.findIndex(segment => segment.id === segmentId)
  return DREKXEL_ROUTINE_SEGMENTS[currentIndex + 1]?.id ?? null
}

export const getWarmupTempo = (warmupId, segmentId, selectedTempo) => {
  if (selectedTempo === 'original' && warmupId === 'drekxelRoutine') {
    return DREKXEL_ROUTINE_SEGMENTS.find(segment => segment.id === segmentId)?.tempo
      ?? DEFAULT_WARMUP_TEMPO
  }

  const numericTempo = Number(selectedTempo)
  return Number.isFinite(numericTempo) ? numericTempo : DEFAULT_WARMUP_TEMPO
}

export const getWarmupRoundCount = (warmupId, ascendingKeyCount) => {
  const safeKeyCount = Math.max(1, Math.min(12, Math.round(Number(ascendingKeyCount) || 1)))
  return warmupId === 'drekxelRoutine' && safeKeyCount > 1
    ? safeKeyCount * 2 - 2
    : safeKeyCount
}

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
    description: 'Six original-paced blocks for articulation, resonance, and airflow.',
    syllable: 'M · R · BRR · BRR↗↘ · DZZZ · B',
    segments: DREKXEL_ROUTINE_SEGMENTS
  }
]

export const WARMUP_TEMPOS = [
  { value: 60, label: '60 BPM · Slow' },
  { value: 72, label: '72 BPM · Comfortable' },
  { value: 88, label: '88 BPM · Flowing' },
  { value: 100, label: '100 BPM' },
  { value: 110, label: '110 BPM' },
  { value: 120, label: '120 BPM · Lively' },
  { value: 132, label: '132 BPM · Quick' }
]

export const WARMUP_KEY_COUNTS = [3, 5, 7, 9]

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
  keyCount = DEFAULT_WARMUP_KEY_COUNT,
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
  const ascendingOffsets = Array.from({ length: safeKeyCount }, (_, index) => index)
  const keyOffsets = warmup.segments && safeKeyCount > 1
    ? [...ascendingOffsets, ...ascendingOffsets.slice(1, -1).reverse()]
    : ascendingOffsets

  return segments.flatMap(segment => {
    const segmentIndex = warmup.segments ? warmup.segments.indexOf(segment) : 0
    return keyOffsets.map((keyOffset, cycleIndex) => {
      const cycleTonicMidi = tonicMidi + keyOffset
      const pattern = segment.semitones || segment.degrees
      return pattern.map((value, patternIndex) => ({
        midi: cycleTonicMidi + (segment.semitones ? value : scaleWithOctave[value]),
        degree: segment.semitones ? null : value,
        durationBeats: segment.durationBeats?.[patternIndex] ?? 1,
        restAfterBeats: segment.restBeats,
        patternIndex,
        cycleIndex,
        keyOffset,
        cycleTonicMidi,
        segmentId: segment.id,
        segmentIndex
      }))
    }).flat()
  })
}
