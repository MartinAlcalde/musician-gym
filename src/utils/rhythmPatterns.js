export const RHYTHM_METERS = [2, 3, 4, 5, 7]

export const RHYTHM_DIVISIONS = {
  quarter: { perBeat: 1, symbol: '♩' },
  eighth: { perBeat: 2, symbol: '♪' },
  triplet: { perBeat: 3, symbol: '♩³' },
  sixteenth: { perBeat: 4, symbol: '♬' }
}

export const RHYTHM_ACCENT_FOCI = [
  'adaptive',
  'beat-1',
  'beat-2',
  'beat-3',
  'beat-4',
  'offbeat'
]

export const RHYTHM_PRESETS = [
  {
    id: 'fixed-basic',
    mode: 'fixed',
    level: 1,
    name: 'Pulso esencial',
    nameEn: 'Essential pulse',
    notation: ['R!', null, 'R', null, 'R', null, 'R', null]
  },
  {
    id: 'fixed-medium',
    mode: 'fixed',
    level: 4,
    name: 'Funk base',
    nameEn: 'Core funk',
    notation: ['R!', 'L', null, 'L', 'R', null, 'R', 'L']
  },
  {
    id: 'fixed-advanced',
    mode: 'fixed',
    level: 8,
    name: 'Cierre denso',
    nameEn: 'Dense ending',
    notation: ['R', null, null, 'L', 'R', 'L', 'R!', 'L']
  },
  {
    id: 'free-basic',
    mode: 'free',
    level: 2,
    name: 'Coordinación base',
    nameEn: 'Basic coordination',
    notation: ['R!', null, 'R', null, 'L', null, 'R', null]
  },
  {
    id: 'free-medium',
    mode: 'free',
    level: 5,
    name: 'Dobles en pocket',
    nameEn: 'Pocket doubles',
    notation: ['R!', 'R', null, 'L', 'L', null, 'R', 'L']
  },
  {
    id: 'free-advanced',
    mode: 'free',
    level: 9,
    name: 'Cadena izquierda',
    nameEn: 'Left-hand chain',
    notation: ['L', 'R', 'R', 'L', null, 'L', 'R!', 'R']
  }
]

const CLASSIC_GROOVES = [
  { mask: '10101010', level: 1, name: 'Negras', nameEn: 'Quarter pulse' },
  { mask: '10101011', level: 2, name: 'Cierre abierto', nameEn: 'Open ending' },
  { mask: '11101010', level: 2, name: 'Pickup', nameEn: 'Pickup' },
  { mask: '10111010', level: 2, name: 'Anticipo', nameEn: 'Anticipation' },
  { mask: '10101110', level: 3, name: 'Empuje en tres', nameEn: 'Beat-three push' },
  { mask: '10111011', level: 3, name: 'Pop recto', nameEn: 'Straight pop' },
  { mask: '11101011', level: 3, name: 'Rock abierto', nameEn: 'Open rock' },
  { mask: '11011010', level: 3, name: 'Clave corta', nameEn: 'Short clave' },
  { mask: '11011011', level: 4, name: 'Funk base', nameEn: 'Core funk' },
  { mask: '10110101', level: 4, name: 'Contratiempo par', nameEn: 'Even offbeat' },
  { mask: '11101101', level: 4, name: 'Soul lleno', nameEn: 'Full soul' },
  { mask: '10110110', level: 4, name: 'Empuje central', nameEn: 'Center push' },
  { mask: '11011101', level: 5, name: 'Pocket sincopado', nameEn: 'Syncopated pocket' },
  { mask: '10011011', level: 5, name: 'Aire en dos', nameEn: 'Space on two' },
  { mask: '10101101', level: 5, name: 'Backbeat abierto', nameEn: 'Open backbeat' },
  { mask: '11100111', level: 5, name: 'Dos bloques', nameEn: 'Two blocks' },
  { mask: '11011001', level: 6, name: 'Funk seco', nameEn: 'Dry funk' },
  { mask: '10011111', level: 6, name: 'Cierre denso', nameEn: 'Dense ending' },
  { mask: '10100111', level: 6, name: 'Hueco central', nameEn: 'Center gap' },
  { mask: '11001101', level: 6, name: 'Soul cruzado', nameEn: 'Crossed soul' },
  { mask: '10010111', level: 7, name: 'Tres anticipaciones', nameEn: 'Three anticipations' },
  { mask: '01101011', level: 7, name: 'Entrada en el aire', nameEn: 'Offbeat entrance' },
  { mask: '11010011', level: 7, name: 'Reggae invertido', nameEn: 'Inverted reggae' },
  { mask: '10110001', level: 7, name: 'Hueco largo', nameEn: 'Long gap' },
  { mask: '01011011', level: 8, name: 'Entrada fantasma', nameEn: 'Ghost entrance' },
  { mask: '10010101', level: 8, name: 'Cadena de contras', nameEn: 'Offbeat chain' },
  { mask: '01100111', level: 8, name: 'Arrastre tardío', nameEn: 'Late drag' },
  { mask: '11001001', level: 8, name: 'Pocket quebrado', nameEn: 'Broken pocket' },
  { mask: '01001101', level: 9, name: 'Reggae desplazado', nameEn: 'Shifted reggae' },
  { mask: '10010011', level: 9, name: 'Silencio elástico', nameEn: 'Elastic rest' },
  { mask: '01100101', level: 9, name: 'Síncopa larga', nameEn: 'Long syncopation' },
  { mask: '00110111', level: 9, name: 'Entrada tardía', nameEn: 'Late entrance' },
  { mask: '01001011', level: 10, name: 'Contrapulso', nameEn: 'Counterpulse' },
  { mask: '00110101', level: 10, name: 'Pulso oculto', nameEn: 'Hidden pulse' },
  { mask: '01100011', level: 10, name: 'Dos islas', nameEn: 'Two islands' },
  { mask: '10001101', level: 10, name: 'Vacío profundo', nameEn: 'Deep space' }
]

export const clampRhythmValue = (value, min, max) => Math.min(max, Math.max(min, value))

const randomItem = (items, random) => items[Math.floor(random() * items.length)]

const makePatternId = () => (
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
)

const estimatePattern = (baseLevel, steps, accentIndex, mode) => {
  let score = baseLevel
  if (accentIndex >= Math.floor(steps.length / 2)) score += 0.35
  if (mode === 'free') {
    const hands = steps.flatMap(step => step.hand ? [step.hand] : [])
    const repeats = hands.slice(1).filter((hand, index) => hand === hands[index]).length
    score += Math.min(1.6, repeats * 0.42)
    if (hands[0] === 'L') score += 0.75
  }
  return clampRhythmValue(Math.round(score), 1, 10)
}

const buildHands = (mask, level, random) => {
  const activeIndexes = [...mask]
    .map((value, index) => value === '1' ? index : -1)
    .filter(index => index >= 0)
  const hands = Array(mask.length).fill(null)
  let current = level >= 6 && random() < 0.12 + level * 0.035 ? 'L' : 'R'
  let previous = null
  let run = 0
  const maxRun = level >= 8 ? 3 : 2

  activeIndexes.forEach((index, activePosition) => {
    if (activePosition > 0) {
      const repeatChance = clampRhythmValue(0.04 + level * 0.045, 0.08, 0.5)
      const repeat = run < maxRun && random() < repeatChance
      current = repeat ? current : current === 'R' ? 'L' : 'R'
    }
    run = previous === current ? run + 1 : 1
    if (run > maxRun) {
      current = current === 'R' ? 'L' : 'R'
      run = 1
    }
    hands[index] = current
    previous = current
  })

  if (activeIndexes.length > 2 && new Set(hands.filter(Boolean)).size === 1) {
    const middle = activeIndexes[Math.floor(activeIndexes.length / 2)]
    hands[middle] = hands[middle] === 'R' ? 'L' : 'R'
  }
  return hands
}

const buildMusicalMask = (beats, division, level, random) => {
  const perBeat = RHYTHM_DIVISIONS[division].perBeat
  const band = level <= 3 ? 'easy' : level <= 6 ? 'medium' : 'hard'
  const motifs = {
    1: {
      easy: ['1', '1', '1', '1'],
      medium: ['1', '1', '0'],
      hard: ['1', '0', '1', '0']
    },
    2: {
      easy: ['10', '10', '10', '11'],
      medium: ['10', '11', '01', '10'],
      hard: ['01', '11', '10', '00', '01']
    },
    3: {
      easy: ['100', '100', '101', '100'],
      medium: ['100', '101', '110', '011'],
      hard: ['011', '101', '110', '010', '111', '001']
    },
    4: {
      easy: ['1000', '1010', '1001', '1100'],
      medium: ['1010', '1001', '1101', '1011', '0110', '1100'],
      hard: ['0101', '0011', '0111', '1001', '1101', '0100', '1011']
    }
  }
  const pool = motifs[perBeat][band]
  const parts = Array.from({ length: beats }, (_, beat) => {
    if (beat === 0 && level <= 3) {
      const grounded = pool.filter(motif => motif[0] === '1')
      return randomItem(grounded.length ? grounded : pool, random)
    }
    return randomItem(pool, random)
  })
  const mask = parts.join('').split('')
  if (!mask.includes('1')) mask[0] = '1'
  if (!Array.from({ length: beats }, (_, beat) => mask[beat * perBeat]).includes('1')) {
    mask[Math.floor(random() * beats) * perBeat] = '1'
  }
  return mask.join('')
}

const getGeneratedName = (beats, division) => ({
  name: `Frase ${beats}/4 · ${RHYTHM_DIVISIONS[division].symbol}`,
  nameEn: `${beats}/4 phrase · ${RHYTHM_DIVISIONS[division].symbol}`
})

export function generateRhythmPattern({
  mode = 'fixed',
  level = 3,
  beats = 4,
  division = 'eighth',
  accentFocus = 'adaptive',
  random = Math.random
} = {}) {
  const safeMode = mode === 'free' ? 'free' : 'fixed'
  const safeLevel = clampRhythmValue(Math.round(Number(level) || 1), 1, 10)
  const safeBeats = RHYTHM_METERS.includes(Number(beats)) ? Number(beats) : 4
  const safeDivision = RHYTHM_DIVISIONS[division] ? division : 'eighth'
  const safeAccentFocus = RHYTHM_ACCENT_FOCI.includes(accentFocus) ? accentFocus : 'adaptive'
  const isClassicGrid = safeBeats === 4 && safeDivision === 'eighth'
  const near = CLASSIC_GROOVES.filter(groove => Math.abs(groove.level - safeLevel) <= 1)
  const perBeat = RHYTHM_DIVISIONS[safeDivision].perBeat
  let best = null

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const classic = isClassicGrid ? randomItem(near.length ? near : CLASSIC_GROOVES, random) : null
    const mask = (classic?.mask ?? buildMusicalMask(safeBeats, safeDivision, safeLevel, random)).split('')
    const strongHits = Array.from({ length: safeBeats }, (_, beat) => beat * perBeat)
      .filter(index => mask[index] === '1')
    let accentIndex

    if (safeAccentFocus.startsWith('beat-')) {
      const requestedBeat = Number(safeAccentFocus.slice(5)) - 1
      accentIndex = clampRhythmValue(requestedBeat, 0, safeBeats - 1) * perBeat
      mask[accentIndex] = '1'
    } else if (safeAccentFocus === 'offbeat' && perBeat > 1) {
      const offbeats = mask
        .map((value, index) => value === '1' && index % perBeat !== 0 ? index : -1)
        .filter(index => index >= 0)
      accentIndex = offbeats.length
        ? randomItem(offbeats, random)
        : Math.floor(random() * safeBeats) * perBeat + 1
      mask[accentIndex] = '1'
    } else {
      const activeIndexes = mask
        .map((value, index) => value === '1' ? index : -1)
        .filter(index => index >= 0)
      const accentPool = safeLevel <= 2 && strongHits.includes(0)
        ? [0]
        : safeLevel <= 5
          ? strongHits.filter(index => index < Math.ceil(safeBeats / 2) * perBeat)
          : strongHits
      accentIndex = randomItem(accentPool.length ? accentPool : activeIndexes, random)
    }

    const maskValue = mask.join('')
    const freeHands = safeMode === 'free' ? buildHands(maskValue, safeLevel, random) : null
    const steps = mask.map((value, index) => ({
      hand: value === '0'
        ? null
        : safeMode === 'fixed'
          ? index % 2 === 0 ? 'R' : 'L'
          : freeHands[index] ?? 'R',
      accent: index === accentIndex
    }))
    const rating = estimatePattern(classic?.level ?? safeLevel, steps, accentIndex, safeMode)
    const names = classic ?? getGeneratedName(safeBeats, safeDivision)
    const candidate = {
      id: makePatternId(),
      mode: safeMode,
      level: safeLevel,
      rating,
      beats: safeBeats,
      division: safeDivision,
      groove: names.name,
      grooveEn: names.nameEn,
      steps
    }

    if (!best || Math.abs(rating - safeLevel) < Math.abs(best.rating - safeLevel)) best = candidate
    if (rating === safeLevel) return candidate
  }

  return best
}

export function createRhythmPresetPattern(presetId) {
  const preset = RHYTHM_PRESETS.find(option => option.id === presetId) ?? RHYTHM_PRESETS[0]
  return {
    id: `preset-${preset.id}-${makePatternId()}`,
    mode: preset.mode,
    level: preset.level,
    rating: preset.level,
    beats: 4,
    division: 'eighth',
    groove: preset.name,
    grooveEn: preset.nameEn,
    steps: preset.notation.map(token => ({
      hand: token?.replace('!', '') ?? null,
      accent: Boolean(token?.includes('!'))
    }))
  }
}

export function getRhythmCountLabels(beats, division) {
  const safeDivision = RHYTHM_DIVISIONS[division] ? division : 'eighth'
  const perBeat = RHYTHM_DIVISIONS[safeDivision].perBeat
  const syllables = safeDivision === 'quarter'
    ? ['']
    : safeDivision === 'eighth'
      ? ['', '&']
      : safeDivision === 'triplet'
        ? ['', 'tri', 'plet']
        : ['', 'e', '&', 'a']
  return Array.from({ length: beats * perBeat }, (_, index) => {
    const beat = Math.floor(index / perBeat) + 1
    return syllables[index % perBeat] || String(beat)
  })
}

export function isRhythmPattern(value) {
  if (!value || typeof value !== 'object') return false
  const division = RHYTHM_DIVISIONS[value.division]
  return typeof value.id === 'string' &&
    (value.mode === 'fixed' || value.mode === 'free') &&
    Number.isInteger(value.level) &&
    Number.isInteger(value.rating) &&
    RHYTHM_METERS.includes(value.beats) &&
    Boolean(division) &&
    typeof value.groove === 'string' &&
    Array.isArray(value.steps) &&
    value.steps.length === value.beats * division.perBeat &&
    value.steps.every(step => (
      step &&
      (step.hand === 'R' || step.hand === 'L' || step.hand === null) &&
      typeof step.accent === 'boolean'
    ))
}

export const secondsPerRhythmBeat = bpm => 60 / clampRhythmValue(Number(bpm) || 84, 40, 180)

export const secondsPerRhythmStep = (bpm, division) => (
  secondsPerRhythmBeat(bpm) / RHYTHM_DIVISIONS[division].perBeat
)

export function rhythmPatternText(pattern, locale = 'es') {
  const labels = getRhythmCountLabels(pattern.beats, pattern.division)
  const hands = pattern.steps.map(step => step.hand
    ? `${locale === 'es' ? (step.hand === 'R' ? 'D' : 'I') : step.hand}${step.accent ? '!' : ''}`
    : '–')
  const level = locale === 'es' ? 'nivel' : 'level'
  return `${labels.join('  ')}\n${hands.join('  ')}\nMusician Gym · R3 · ${pattern.beats}/4 · ${level} ${pattern.rating}`
}
