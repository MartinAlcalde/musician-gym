import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useManagedTimeouts } from '../hooks/useManagedTimeouts.js'
import {
  clampRhythmValue,
  createRhythmPresetPattern,
  generateRhythmPattern,
  getRhythmCountLabels,
  isRhythmPattern,
  RHYTHM_ACCENT_FOCI,
  RHYTHM_DIVISIONS,
  RHYTHM_METERS,
  RHYTHM_PRESETS,
  rhythmPatternText,
  secondsPerRhythmBeat,
  secondsPerRhythmStep
} from '../utils/rhythmPatterns.js'

const STORAGE_KEY = 'musician-gym-rhythm-v1'
const LEGACY_STORAGE_KEY = 'rhythm3-session-v2'
const MIN_BPM = 40
const MAX_BPM = 180
const SCHEDULER_LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.25
const START_DELAY_SECONDS = 0.08
const MAX_SCHEDULER_LATENESS_SECONDS = 0.08

const DEFAULT_SESSION = {
  mode: 'fixed',
  level: 3,
  beats: 4,
  division: 'eighth',
  accentFocus: 'adaptive',
  practiceView: 'hands',
  bpm: 84,
  loop: true,
  sound: true,
  click: false,
  countIn: true,
  imagineFirst: false,
  silenceSound: false
}

const normalizeLegacyPattern = value => {
  if (!value || typeof value !== 'object' || !Array.isArray(value.steps)) return value
  return {
    ...value,
    grooveEn: value.grooveEn ?? value.groove,
    steps: value.steps.map(step => ({
      ...step,
      hand: step.hand === 'D' ? 'R' : step.hand === 'I' ? 'L' : step.hand
    }))
  }
}

const loadRhythmSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return DEFAULT_SESSION
    const saved = JSON.parse(raw)
    const pattern = normalizeLegacyPattern(saved.pattern)
    const history = Array.isArray(saved.history)
      ? saved.history.map(normalizeLegacyPattern).filter(isRhythmPattern).slice(0, 8)
      : []
    const favorites = Array.isArray(saved.favorites)
      ? saved.favorites.map(normalizeLegacyPattern).filter(isRhythmPattern).slice(0, 12)
      : []
    const safePattern = isRhythmPattern(pattern) ? pattern : null
    const division = safePattern?.division ?? (
      RHYTHM_DIVISIONS[saved.division] ? saved.division : DEFAULT_SESSION.division
    )
    const beats = safePattern?.beats ?? (
      RHYTHM_METERS.includes(saved.beats) ? saved.beats : DEFAULT_SESSION.beats
    )
    const mode = safePattern?.mode ?? (saved.mode === 'free' ? 'free' : 'fixed')
    const level = safePattern?.level ?? clampRhythmValue(Number(saved.level) || 3, 1, 10)

    return {
      ...DEFAULT_SESSION,
      ...saved,
      pattern: safePattern,
      history,
      favorites,
      mode,
      level,
      beats,
      division,
      bpm: clampRhythmValue(Number(saved.bpm) || DEFAULT_SESSION.bpm, MIN_BPM, MAX_BPM),
      practiceView: ['hands', 'guitar', 'feet'].includes(saved.practiceView)
        ? saved.practiceView
        : DEFAULT_SESSION.practiceView,
      accentFocus: RHYTHM_ACCENT_FOCI.includes(saved.accentFocus)
        ? saved.accentFocus
        : DEFAULT_SESSION.accentFocus
    }
  } catch {
    return DEFAULT_SESSION
  }
}

const RhythmOption = ({ id, label, detail, checked, onChange }) => (
  <label className="rhythm-option" htmlFor={id}>
    <span><strong>{label}</strong><small>{detail}</small></span>
    <input id={id} type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
  </label>
)

export function RhythmPractice({ screenWakeLock }) {
  const { locale, t } = useI18n()
  const [initialSession] = useState(loadRhythmSession)
  const [mode, setMode] = useState(initialSession.mode)
  const [level, setLevel] = useState(initialSession.level)
  const [beats, setBeats] = useState(initialSession.beats)
  const [division, setDivision] = useState(initialSession.division)
  const [accentFocus, setAccentFocus] = useState(initialSession.accentFocus)
  const [practiceView, setPracticeView] = useState(initialSession.practiceView)
  const [bpm, setBpm] = useState(initialSession.bpm)
  const [loop, setLoop] = useState(initialSession.loop)
  const [sound, setSound] = useState(initialSession.sound)
  const [click, setClick] = useState(initialSession.click)
  const [countIn, setCountIn] = useState(initialSession.countIn)
  const [imagineFirst, setImagineFirst] = useState(initialSession.imagineFirst)
  const [silenceSound, setSilenceSound] = useState(initialSession.silenceSound)
  const [pattern, setPattern] = useState(() => initialSession.pattern ?? generateRhythmPattern(initialSession))
  const [history, setHistory] = useState(initialSession.history ?? [])
  const [favorites, setFavorites] = useState(initialSession.favorites ?? [])
  const [playing, setPlaying] = useState(false)
  const [visual, setVisual] = useState({ phase: 'idle', step: -1, beat: -1 })
  const [notice, setNotice] = useState('')
  const [audioError, setAudioError] = useState('')
  const { schedule: scheduleNotice, clearAll: clearNotices } = useManagedTimeouts()

  const audioContextRef = useRef(null)
  const activeNodesRef = useRef(new Set())
  const visualQueueRef = useRef([])
  const visualFrameRef = useRef(null)
  const patternRef = useRef(pattern)
  const bpmRef = useRef(bpm)
  const loopRef = useRef(loop)
  const soundRef = useRef(sound)
  const clickRef = useRef(click)
  const countInRef = useRef(countIn)
  const imagineFirstRef = useRef(imagineFirst)
  const silenceSoundRef = useRef(silenceSound)
  const requestWakeLock = screenWakeLock?.request
  const releaseWakeLock = screenWakeLock?.release

  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { loopRef.current = loop }, [loop])
  useEffect(() => { soundRef.current = sound }, [sound])
  useEffect(() => { clickRef.current = click }, [click])
  useEffect(() => { countInRef.current = countIn }, [countIn])
  useEffect(() => { imagineFirstRef.current = imagineFirst }, [imagineFirst])
  useEffect(() => { silenceSoundRef.current = silenceSound }, [silenceSound])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        level,
        beats,
        division,
        accentFocus,
        practiceView,
        bpm,
        loop,
        sound,
        click,
        countIn,
        imagineFirst,
        silenceSound,
        pattern,
        history,
        favorites
      }))
    } catch {
      // Rhythm practice still works when local storage is unavailable.
    }
  }, [accentFocus, beats, bpm, click, countIn, division, favorites, history, imagineFirst, level, loop, mode, pattern, practiceView, silenceSound, sound])

  const stopNodes = useCallback(() => {
    activeNodesRef.current.forEach(node => {
      try {
        node.stop()
      } catch {
        // The scheduled oscillator may already have ended.
      }
    })
    activeNodesRef.current.clear()
  }, [])

  const pausePlayback = useCallback(() => {
    setPlaying(false)
    setVisual({ phase: 'idle', step: -1, beat: -1 })
    visualQueueRef.current = []
    if (visualFrameRef.current !== null) {
      cancelAnimationFrame(visualFrameRef.current)
      visualFrameRef.current = null
    }
    stopNodes()
    void releaseWakeLock?.()
  }, [releaseWakeLock, stopNodes])

  const playTone = useCallback((hand, accented, time) => {
    const context = audioContextRef.current
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const isClick = hand === 'click'
    const isGhost = hand === 'ghost'
    const frequency = isClick ? (accented ? 1320 : 880) : isGhost ? 390 : hand === 'R' ? 155 : 238
    const volume = isClick ? (accented ? 0.29 : 0.17) : isGhost ? 0.07 : accented ? 0.7 : 0.44
    const duration = isClick ? (accented ? 0.055 : 0.038) : isGhost ? 0.032 : accented ? 0.105 : 0.075
    oscillator.type = isClick ? 'sine' : isGhost ? 'triangle' : hand === 'R' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, time)
    if (!isClick && !isGhost) {
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, time + duration)
    }
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(time)
    oscillator.stop(time + duration + 0.01)
    activeNodesRef.current.add(oscillator)
    oscillator.onended = () => activeNodesRef.current.delete(oscillator)
  }, [])

  useEffect(() => {
    if (!playing) return undefined
    const context = audioContextRef.current
    if (!context) return undefined
    let cancelled = false
    let schedulerTimer = 0
    let phase = countInRef.current ? 'countIn' : imagineFirstRef.current ? 'imagine' : 'pattern'
    let phaseBeat = 0
    let step = 0
    let nextEventTime = context.currentTime + START_DELAY_SECONDS
    let completionScheduled = false
    let stopAt = null
    const visualLatency = Math.min(context.outputLatency || context.baseLatency || 0, 0.12)

    const queueVisual = (cue, time) => {
      visualQueueRef.current.push({ ...cue, time: time + visualLatency })
    }

    const renderVisuals = () => {
      if (cancelled) return
      const now = context.currentTime
      let latest
      while (visualQueueRef.current[0]?.time <= now) latest = visualQueueRef.current.shift()
      if (latest) setVisual(latest)
      if (stopAt !== null && now >= stopAt + visualLatency) {
        pausePlayback()
        return
      }
      visualFrameRef.current = requestAnimationFrame(renderVisuals)
    }

    const scheduleNextEvent = () => {
      const scheduledPattern = patternRef.current
      if (phase === 'countIn' || phase === 'imagine') {
        queueVisual({ phase, step: -1, beat: phaseBeat }, nextEventTime)
        playTone('click', phaseBeat === 0, nextEventTime)
        nextEventTime += secondsPerRhythmBeat(bpmRef.current)
        phaseBeat += 1
        if (phaseBeat >= scheduledPattern.beats) {
          phase = phase === 'countIn' && imagineFirstRef.current ? 'imagine' : 'pattern'
          phaseBeat = 0
        }
        return
      }

      const perBeat = RHYTHM_DIVISIONS[scheduledPattern.division].perBeat
      const item = scheduledPattern.steps[step]
      const beat = Math.floor(step / perBeat)
      queueVisual({ phase: 'pattern', step, beat }, nextEventTime)
      if (clickRef.current && step % perBeat === 0) playTone('click', step === 0, nextEventTime)
      if (soundRef.current) {
        if (item.hand) playTone(item.hand, item.accent, nextEventTime)
        else if (silenceSoundRef.current) playTone('ghost', false, nextEventTime)
      }
      nextEventTime += secondsPerRhythmStep(bpmRef.current, scheduledPattern.division)
      if (step === scheduledPattern.steps.length - 1) {
        if (loopRef.current) step = 0
        else {
          completionScheduled = true
          stopAt = nextEventTime
        }
      } else {
        step += 1
      }
    }

    const tick = () => {
      if (cancelled) return
      const now = context.currentTime
      if (nextEventTime < now - MAX_SCHEDULER_LATENESS_SECONDS) {
        nextEventTime = now + START_DELAY_SECONDS
        visualQueueRef.current = []
      }
      while (!completionScheduled && nextEventTime < now + SCHEDULE_AHEAD_SECONDS) scheduleNextEvent()
      if (!completionScheduled) schedulerTimer = window.setTimeout(tick, SCHEDULER_LOOKAHEAD_MS)
    }

    visualQueueRef.current = []
    visualFrameRef.current = requestAnimationFrame(renderVisuals)
    tick()
    return () => {
      cancelled = true
      window.clearTimeout(schedulerTimer)
      if (visualFrameRef.current !== null) {
        cancelAnimationFrame(visualFrameRef.current)
        visualFrameRef.current = null
      }
      visualQueueRef.current = []
    }
  }, [pausePlayback, playTone, playing])

  useEffect(() => () => {
    clearNotices()
    if (visualFrameRef.current !== null) cancelAnimationFrame(visualFrameRef.current)
    visualQueueRef.current = []
    stopNodes()
    void releaseWakeLock?.()
    void audioContextRef.current?.close()
  }, [clearNotices, releaseWakeLock, stopNodes])

  const startPlayback = useCallback(async () => {
    if (playing) return
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext
    if (!AudioContextClass) {
      setAudioError(t('rhythm.audioUnsupported'))
      return
    }
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass({ latencyHint: 'interactive' })
      }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
      setAudioError('')
      setVisual({ phase: 'idle', step: -1, beat: -1 })
      setPlaying(true)
      void requestWakeLock?.()
    } catch {
      setAudioError(t('rhythm.audioError'))
    }
  }, [playing, requestWakeLock, t])

  const replacePattern = useCallback((nextPattern, remember = true) => {
    pausePlayback()
    if (remember && patternRef.current.id !== nextPattern.id) {
      setHistory(items => [
        patternRef.current,
        ...items.filter(item => item.id !== patternRef.current.id)
      ].slice(0, 8))
    }
    setPattern(nextPattern)
    setMode(nextPattern.mode)
    setLevel(nextPattern.level)
    setBeats(nextPattern.beats)
    setDivision(nextPattern.division)
  }, [pausePlayback])

  const makePattern = useCallback(overrides => generateRhythmPattern({
    mode,
    level,
    beats,
    division,
    accentFocus,
    ...overrides
  }), [accentFocus, beats, division, level, mode])

  const changePatternSetting = (setting, value) => {
    const overrides = { [setting]: value }
    if (setting === 'mode') setMode(value)
    if (setting === 'level') setLevel(value)
    if (setting === 'beats') {
      setBeats(value)
      if (accentFocus.startsWith('beat-') && Number(accentFocus.slice(5)) > value) {
        setAccentFocus('adaptive')
        overrides.accentFocus = 'adaptive'
      }
    }
    if (setting === 'division') {
      setDivision(value)
      if (value === 'quarter' && accentFocus === 'offbeat') {
        setAccentFocus('adaptive')
        overrides.accentFocus = 'adaptive'
      }
    }
    if (setting === 'accentFocus') setAccentFocus(value)
    replacePattern(makePattern(overrides))
  }

  const newPattern = useCallback(() => replacePattern(makePattern({})), [makePattern, replacePattern])
  const isFavorite = favorites.some(item => item.id === pattern.id)
  const libraryPatterns = useMemo(() => {
    const seen = new Set()
    return [...favorites, ...history].filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    }).slice(0, 8)
  }, [favorites, history])

  const showNotice = message => {
    clearNotices()
    setNotice(message)
    scheduleNotice(() => setNotice(''), 2200)
  }

  const copyPattern = async () => {
    try {
      await navigator.clipboard.writeText(rhythmPatternText(pattern, locale))
      showNotice(t('rhythm.copied'))
    } catch {
      showNotice(t('rhythm.copyError'))
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      showNotice(t('rhythm.fullscreenError'))
    }
  }

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.target?.closest('button, input, select, textarea, [contenteditable="true"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        if (playing) pausePlayback()
        else void startPlayback()
      }
      if (event.key.toLowerCase() === 'n') newPattern()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [newPattern, pausePlayback, playing, startPlayback])

  const perBeat = RHYTHM_DIVISIONS[pattern.division].perBeat
  const labels = getRhythmCountLabels(pattern.beats, pattern.division)
  const currentStep = visual.phase === 'pattern' ? visual.step : -1
  const currentBeat = visual.beat
  const activeItem = currentStep >= 0 ? pattern.steps[currentStep] : null
  const grooveName = locale === 'es' ? pattern.groove : pattern.grooveEn
  const activeLabel = visual.phase === 'countIn'
    ? t('rhythm.phase.countIn')
    : visual.phase === 'imagine'
      ? t('rhythm.phase.imagine')
      : activeItem?.hand === 'R'
        ? t(practiceView === 'guitar' ? 'rhythm.stroke.down' : 'rhythm.hand.right')
        : activeItem?.hand === 'L'
          ? t(practiceView === 'guitar' ? 'rhythm.stroke.up' : 'rhythm.hand.left')
          : activeItem ? t('rhythm.rest') : playing ? t('rhythm.preparing') : t('rhythm.ready')
  const availableAccentFoci = RHYTHM_ACCENT_FOCI.filter(focus => {
    if (focus === 'offbeat') return perBeat > 1
    if (!focus.startsWith('beat-')) return true
    return Number(focus.slice(5)) <= beats
  })

  return (
    <section className="rhythm-practice" aria-labelledby="rhythm-heading">
      <header className="section-intro rhythm-intro">
        <div>
          <p className="eyebrow">{t('rhythm.eyebrow')}</p>
          <h2 id="rhythm-heading">{t('rhythm.title')}</h2>
        </div>
        <span className="rhythm-shortcuts">{t('rhythm.shortcuts')}</span>
      </header>

      <fieldset className="rhythm-setup" aria-label={t('rhythm.setup')}>
        <div className="rhythm-control rhythm-control-wide">
          <span className="rhythm-control-label">{t('rhythm.mode')}</span>
          <div className="segmented-control">
            {['fixed', 'free'].map(value => (
              <button
                type="button"
                key={value}
                className={mode === value ? 'active' : ''}
                aria-pressed={mode === value}
                onClick={() => changePatternSetting('mode', value)}
              >
                {t(`rhythm.mode.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="rhythm-control rhythm-control-wide">
          <span className="rhythm-control-label">{t('rhythm.practice')}</span>
          <div className="segmented-control rhythm-practice-target">
            {['hands', 'guitar', 'feet'].map(value => (
              <button
                type="button"
                key={value}
                className={practiceView === value ? 'active' : ''}
                aria-pressed={practiceView === value}
                onClick={() => setPracticeView(value)}
              >
                {t(`rhythm.practice.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="rhythm-control">
          <span>{t('rhythm.meter')}</span>
          <select value={beats} onChange={event => changePatternSetting('beats', Number(event.target.value))}>
            {RHYTHM_METERS.map(value => <option key={value} value={value}>{value}/4</option>)}
          </select>
        </label>

        <label className="rhythm-control">
          <span>{t('rhythm.division')}</span>
          <select value={division} onChange={event => changePatternSetting('division', event.target.value)}>
            {Object.entries(RHYTHM_DIVISIONS).map(([value, option]) => (
              <option key={value} value={value}>{option.symbol} {t(`rhythm.division.${value}`)}</option>
            ))}
          </select>
        </label>

        <label className="rhythm-control rhythm-level-control">
          <span>{t('rhythm.level')} <output>{level}</output></span>
          <input
            type="range"
            min="1"
            max="10"
            value={level}
            aria-label={t('rhythm.level')}
            onChange={event => setLevel(Number(event.target.value))}
            onPointerUp={() => changePatternSetting('level', level)}
            onKeyUp={() => changePatternSetting('level', level)}
          />
          <small><span>{t('rhythm.level.basic')}</span><span>{t('rhythm.level.advanced')}</span></small>
        </label>
      </fieldset>

      <section
        className={`rhythm-stage phase-${visual.phase} ${playing && currentBeat === 0 ? 'downbeat' : ''}`}
        aria-label={t('rhythm.pattern')}
      >
        <header className="rhythm-stage-heading">
          <div>
            <p>{t(`rhythm.mode.${mode}`)} · {t('rhythm.estimated', { count: pattern.rating })} · {pattern.beats}/4</p>
            <h3>{grooveName}</h3>
          </div>
          <div className="rhythm-live-status" data-hand={activeItem?.hand ?? 'rest'} aria-live="polite">
            <span>{activeItem?.accent ? `${activeLabel} · ${t('rhythm.accent')}` : activeLabel}</span>
            {playing && currentBeat >= 0 && <strong>{currentBeat + 1}</strong>}
            <i aria-hidden="true" />
          </div>
        </header>

        <div className="rhythm-pattern-scroller">
          <div className="rhythm-pattern-board" style={{ '--rhythm-step-count': pattern.steps.length }}>
            <div className="rhythm-count-grid" aria-hidden="true">
              {labels.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className={`${index % perBeat === 0 ? 'strong' : ''} ${
                    playing && index % perBeat === 0 && currentBeat === Math.floor(index / perBeat)
                      ? 'active'
                      : ''
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="rhythm-pattern-grid" role="group" aria-label={t('rhythm.pattern')}>
              {pattern.steps.map((step, index) => {
                const state = step.hand === 'R' ? 'right' : step.hand === 'L' ? 'left' : 'rest'
                const display = step.hand
                  ? practiceView === 'guitar'
                    ? step.hand === 'R' ? '↓' : '↑'
                    : locale === 'es' ? step.hand === 'R' ? 'D' : 'I' : step.hand
                  : '–'
                const ariaHand = step.hand === 'R'
                  ? t(practiceView === 'guitar' ? 'rhythm.stroke.down' : 'rhythm.hand.right')
                  : step.hand === 'L'
                    ? t(practiceView === 'guitar' ? 'rhythm.stroke.up' : 'rhythm.hand.left')
                    : t('rhythm.rest')
                return (
                  <span
                    key={`${pattern.id}-${index}`}
                    className={`rhythm-step ${state} ${step.accent ? 'accented' : ''} ${currentStep === index ? 'active' : ''}`}
                    aria-label={`${labels[index]}: ${ariaHand}${step.accent ? `, ${t('rhythm.accent')}` : ''}`}
                  >
                    {step.accent && <b className="rhythm-accent">!</b>}
                    <strong>{display}</strong>
                    {practiceView === 'guitar' && step.hand && (
                      <small>{t(step.hand === 'R' ? 'rhythm.downShort' : 'rhythm.upShort')}</small>
                    )}
                    <i aria-hidden="true" />
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {practiceView === 'feet' && (
          <div className="rhythm-feet" aria-label={t('rhythm.feetTrack')}>
            <strong>{t('rhythm.foot')}</strong>
            <div style={{ '--rhythm-beat-count': pattern.beats }}>
              {Array.from({ length: pattern.beats }, (_, beat) => (
                <span className={playing && currentBeat === beat ? 'active' : ''} key={beat}>
                  X<small>{beat + 1}</small>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rhythm-transport">
          <div className="rhythm-main-actions">
            <button
              type="button"
              className={`rhythm-play ${playing ? 'playing' : ''}`}
              onClick={() => playing ? pausePlayback() : void startPlayback()}
              aria-pressed={playing}
            >
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
              {t(playing ? 'rhythm.pause' : 'rhythm.play')}
            </button>
            <button type="button" className="rhythm-new" onClick={newPattern}>
              <span aria-hidden="true">↻</span> {t('rhythm.newPattern')}
            </button>
          </div>

          <div className="rhythm-tempo" aria-label={t('rhythm.tempo')}>
            <button
              type="button"
              onClick={() => setBpm(value => clampRhythmValue(value - 2, MIN_BPM, MAX_BPM))}
              disabled={bpm <= MIN_BPM}
              aria-label={t('rhythm.tempoDown')}
            >−</button>
            <label>
              <strong>{bpm}</strong><span>BPM</span>
              <input
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                aria-label={t('rhythm.tempo')}
                onChange={event => setBpm(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => setBpm(value => clampRhythmValue(value + 2, MIN_BPM, MAX_BPM))}
              disabled={bpm >= MAX_BPM}
              aria-label={t('rhythm.tempoUp')}
            >+</button>
          </div>
        </div>

        {(audioError || notice) && (
          <p className={audioError ? 'rhythm-message error' : 'rhythm-message'} role="status">
            {audioError || notice}
          </p>
        )}
      </section>

      <details className="rhythm-more">
        <summary>
          <span><strong>{t('rhythm.more')}</strong><small>{t('rhythm.moreDescription')}</small></span>
          <b aria-hidden="true">⌄</b>
        </summary>
        <div className="rhythm-more-content">
          <label className="rhythm-preset-picker">
            <span><strong>{t('rhythm.presets')}</strong><small>{t('rhythm.presetsDetail')}</small></span>
            <select
              value=""
              onChange={event => event.target.value && replacePattern(createRhythmPresetPattern(event.target.value))}
            >
              <option value="" disabled>{t('rhythm.presetsChoose')}</option>
              {RHYTHM_PRESETS.filter(preset => preset.mode === mode).map(preset => (
                <option key={preset.id} value={preset.id}>
                  {locale === 'es' ? preset.name : preset.nameEn} · {t('rhythm.estimated', { count: preset.level })}
                </option>
              ))}
            </select>
          </label>

          <div className="rhythm-options-grid">
            <RhythmOption id="rhythm-loop" label={t('rhythm.option.loop')} detail={t('rhythm.option.loopDetail')} checked={loop} onChange={setLoop} />
            <RhythmOption id="rhythm-sound" label={t('rhythm.option.sound')} detail={t('rhythm.option.soundDetail')} checked={sound} onChange={setSound} />
            <RhythmOption id="rhythm-click" label={t('rhythm.option.click')} detail={t('rhythm.option.clickDetail')} checked={click} onChange={setClick} />
            <RhythmOption id="rhythm-count-in" label={t('rhythm.option.countIn')} detail={t('rhythm.option.countInDetail')} checked={countIn} onChange={setCountIn} />
            <RhythmOption id="rhythm-imagine" label={t('rhythm.option.imagine')} detail={t('rhythm.option.imagineDetail')} checked={imagineFirst} onChange={setImagineFirst} />
            <RhythmOption id="rhythm-silence" label={t('rhythm.option.silence')} detail={t('rhythm.option.silenceDetail')} checked={silenceSound} onChange={setSilenceSound} />
          </div>

          <label className="rhythm-accent-focus">
            <span><strong>{t('rhythm.accentFocus')}</strong><small>{t('rhythm.accentFocusDetail')}</small></span>
            <select value={accentFocus} onChange={event => changePatternSetting('accentFocus', event.target.value)}>
              {availableAccentFoci.map(focus => (
                <option key={focus} value={focus}>
                  {focus === 'adaptive'
                    ? t('rhythm.accentFocus.adaptive')
                    : focus === 'offbeat'
                      ? t('rhythm.accentFocus.offbeat')
                      : t('rhythm.accentFocus.beat', { count: focus.slice(5) })}
                </option>
              ))}
            </select>
          </label>

          <div className="rhythm-tools" aria-label={t('rhythm.tools')}>
            <button type="button" onClick={() => history[0] && replacePattern(history[0], false)} disabled={!history.length}>← {t('rhythm.previous')}</button>
            <button type="button" onClick={() => changePatternSetting('level', clampRhythmValue(level - 1, 1, 10))} disabled={level <= 1}>↓ {t('rhythm.easier')}</button>
            <button type="button" onClick={() => changePatternSetting('level', clampRhythmValue(level + 1, 1, 10))} disabled={level >= 10}>↑ {t('rhythm.harder')}</button>
            <button
              type="button"
              className={isFavorite ? 'active' : ''}
              aria-pressed={isFavorite}
              onClick={() => setFavorites(items => isFavorite
                ? items.filter(item => item.id !== pattern.id)
                : [pattern, ...items].slice(0, 12))}
            >{isFavorite ? '♥' : '♡'} {t('rhythm.favorite')}</button>
            <button type="button" onClick={() => void copyPattern()}>⧉ {t('rhythm.copy')}</button>
            <button type="button" onClick={() => void toggleFullscreen()}>↗ {t('rhythm.fullscreen')}</button>
          </div>
        </div>
      </details>

      {libraryPatterns.length > 0 && (
        <section className="rhythm-history" aria-labelledby="rhythm-history-heading">
          <header>
            <h3 id="rhythm-history-heading">{t('rhythm.history')}</h3>
            <span>{t('rhythm.historyHelp')}</span>
          </header>
          <div>
            {libraryPatterns.map(item => (
              <button type="button" key={item.id} onClick={() => replacePattern(item)}>
                <strong>{item.steps.map(step => step.hand ? locale === 'es' ? step.hand === 'R' ? 'D' : 'I' : step.hand : '–').join('')}</strong>
                <small>N{item.rating}</small>
                {favorites.some(favorite => favorite.id === item.id) && <span aria-hidden="true">♥</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
