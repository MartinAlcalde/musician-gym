import { useEffect, useMemo, useState } from 'react'
import { useVocalWarmup } from '../hooks/useVocalWarmup.js'
import { labelForMidi, displayNoteName, getTonicName } from '../utils/helpers.js'
import {
  VOCAL_WARMUPS,
  WARMUP_KEY_COUNTS,
  WARMUP_TEMPOS
} from '../utils/vocalWarmups.js'

export function SingingPractice({
  audio,
  tonicMidi,
  scaleType,
  notation,
  screenWakeLock
}) {
  const [warmupId, setWarmupId] = useState(VOCAL_WARMUPS[0].id)
  const [tempo, setTempo] = useState(72)
  const [keyCount, setKeyCount] = useState(5)
  const selectedWarmup = useMemo(() => (
    VOCAL_WARMUPS.find(option => option.id === warmupId) || VOCAL_WARMUPS[0]
  ), [warmupId])
  const warmup = useVocalWarmup(audio)
  const stopWarmup = warmup.stop
  const requestWakeLock = screenWakeLock.request
  const releaseWakeLock = screenWakeLock.release

  useEffect(() => () => {
    stopWarmup()
    void releaseWakeLock()
  }, [releaseWakeLock, stopWarmup])

  const handleStart = async () => {
    if (warmup.isRunning) {
      stopWarmup()
      void releaseWakeLock()
      return
    }

    const wakeLockPromise = requestWakeLock()
    const started = await warmup.start({
      warmupId,
      tonicMidi,
      scaleType,
      keyCount,
      tempo,
      onComplete: () => void releaseWakeLock()
    })
    if (!started) void releaseWakeLock()
    await wakeLockPromise
  }

  const currentEvent = warmup.currentEvent
  const currentTonicPc = currentEvent ? currentEvent.cycleTonicMidi % 12 : tonicMidi % 12
  const solfegeLabel = currentEvent
    ? labelForMidi(currentEvent.midi, 'solfege', currentTonicPc, scaleType)
    : '—'
  const letterLabel = currentEvent
    ? displayNoteName(labelForMidi(currentEvent.midi, 'letter', currentTonicPc, scaleType))
    : '—'
  const primaryLabel = notation === 'solfege' ? solfegeLabel : letterLabel
  const secondaryLabel = notation === 'solfege' ? letterLabel : solfegeLabel

  return (
    <section className="singing-practice" aria-labelledby="singing-heading">
      <div className="section-intro">
        <p className="eyebrow">Voice training</p>
        <h2 id="singing-heading">Real-time vocal warm-up</h2>
        <p>Listen to each piano note and sing it on the suggested syllable. Each round moves up one semitone.</p>
      </div>

      <fieldset className="warmup-picker" disabled={warmup.isRunning}>
        <legend>1. Choose an exercise</legend>
        <div className="warmup-grid">
          {VOCAL_WARMUPS.map(option => (
            <label key={option.id} className={`warmup-card ${warmupId === option.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="warmup"
                value={option.id}
                checked={warmupId === option.id}
                onChange={() => setWarmupId(option.id)}
              />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <small>Sing on “{option.syllable}”</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="warmup-options" disabled={warmup.isRunning}>
        <legend>2. Set the pace and range</legend>
        <label>
          Tempo
          <select value={tempo} onChange={event => setTempo(Number(event.target.value))}>
            {WARMUP_TEMPOS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Ascending keys
          <select value={keyCount} onChange={event => setKeyCount(Number(event.target.value))}>
            {WARMUP_KEY_COUNTS.map(value => (
              <option key={value} value={value}>{value} keys</option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="warmup-player">
        <div className="warmup-now" aria-live="polite">
          <span className="muted">{warmup.isRunning ? `Sing “${selectedWarmup.syllable}”` : 'Current note'}</span>
          <strong>{primaryLabel}</strong>
          <span>{secondaryLabel}</span>
          {currentEvent && (
            <small>
              Key {currentEvent.cycleIndex + 1}/{keyCount} · {displayNoteName(getTonicName(currentTonicPc, scaleType))}
            </small>
          )}
        </div>

        <div className="warmup-transport">
          <button
            type="button"
            className="primary-button"
            onClick={handleStart}
            disabled={!audio.isReady}
          >
            {warmup.isRunning ? '■ Stop warm-up' : audio.isReady ? '▶ Start warm-up' : 'Loading piano…'}
          </button>
          <div className="progress-track" role="progressbar" aria-label="Warm-up progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={warmup.progress}>
            <span style={{ width: `${warmup.progress}%` }} />
          </div>
          <p className="warmup-status">
            {warmup.completed
              ? 'Warm-up complete.'
              : warmup.isRunning
                ? `Note ${warmup.step} of ${warmup.totalSteps}`
                : 'Ready when you are.'}
          </p>
        </div>
      </div>

      <div className="voice-safety" role="note">
        <strong>Sing comfortably.</strong> Lower the register if notes feel tight, and stop if you feel strain. Pitch detection is not used yet: this first version is a live guide with piano accompaniment.
      </div>
    </section>
  )
}
