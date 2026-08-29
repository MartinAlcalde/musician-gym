import { useEffect, useMemo, useRef, useState } from 'react'
import { useManagedTimeouts } from '../hooks/useManagedTimeouts.js'
import { useSpeechAnnouncement } from '../hooks/useSpeechAnnouncement.js'
import { useVocalWarmup } from '../hooks/useVocalWarmup.js'
import {
  displayNoteName,
  getTonicName,
  labelForMidi,
  loadFromStorage,
  midiToNoteName,
  saveToStorage
} from '../utils/helpers.js'
import {
  buildVocalWarmupSequence,
  DREKXEL_ROUTINE_SEGMENTS,
  getNextDrekxelSegmentId,
  getVoiceProfileTonicMidi,
  VOICE_PROFILES,
  VOCAL_WARMUPS,
  WARMUP_KEY_COUNTS,
  WARMUP_TEMPOS
} from '../utils/vocalWarmups.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const VOICE_PROFILE_STORAGE_KEY = 'fet-singing-voice-profile'
const getInitialVoiceProfile = () => {
  const saved = loadFromStorage(VOICE_PROFILE_STORAGE_KEY, 'male')
  return VOICE_PROFILES[saved] ? saved : 'male'
}

export function SingingPractice({
  audio,
  tonicMidi,
  scaleType,
  notation,
  screenWakeLock
}) {
  const { t, speechLocale } = useI18n()
  const [warmupId, setWarmupId] = useState(VOCAL_WARMUPS[0].id)
  const [tempo, setTempo] = useState(72)
  const [keyCount, setKeyCount] = useState(5)
  const [voiceProfile, setVoiceProfile] = useState(getInitialVoiceProfile)
  const [drekxelSegmentId, setDrekxelSegmentId] = useState(DREKXEL_ROUTINE_SEGMENTS[0].id)
  const [seekPreview, setSeekPreview] = useState(null)
  const [isBlockTransitioning, setIsBlockTransitioning] = useState(false)
  const seekPreviewRef = useRef(null)
  const routineRunRef = useRef(0)
  const selectedWarmup = useMemo(() => (
    VOCAL_WARMUPS.find(option => option.id === warmupId) || VOCAL_WARMUPS[0]
  ), [warmupId])
  const warmup = useVocalWarmup(audio)
  const { announce, cancel: cancelAnnouncement } = useSpeechAnnouncement()
  const {
    schedule: scheduleBlockTransition,
    clearAll: clearBlockTransitions
  } = useManagedTimeouts()
  const stopWarmup = warmup.stop
  const requestWakeLock = screenWakeLock.request
  const releaseWakeLock = screenWakeLock.release
  const profileTonicMidi = getVoiceProfileTonicMidi(tonicMidi % 12, voiceProfile)
  const activeSegmentId = warmupId === 'drekxelRoutine' ? drekxelSegmentId : undefined
  const previewRange = useMemo(() => {
    const sequence = buildVocalWarmupSequence({
      warmupId,
      tonicMidi: profileTonicMidi,
      scaleType,
      keyCount,
      segmentId: activeSegmentId
    })
    const midis = sequence.map(event => event.midi)
    return {
      lowest: midiToNoteName(Math.min(...midis)),
      highest: midiToNoteName(Math.max(...midis))
    }
  }, [activeSegmentId, keyCount, profileTonicMidi, scaleType, warmupId])

  useEffect(() => saveToStorage(VOICE_PROFILE_STORAGE_KEY, voiceProfile), [voiceProfile])

  useEffect(() => () => {
    routineRunRef.current += 1
    clearBlockTransitions()
    cancelAnnouncement()
    stopWarmup()
    void releaseWakeLock()
  }, [cancelAnnouncement, clearBlockTransitions, releaseWakeLock, stopWarmup])

  const handleStart = async () => {
    if (warmup.isRunning || isBlockTransitioning) {
      routineRunRef.current += 1
      clearBlockTransitions()
      cancelAnnouncement()
      setIsBlockTransitioning(false)
      stopWarmup()
      void releaseWakeLock()
      return
    }

    const runId = routineRunRef.current + 1
    routineRunRef.current = runId
    const wakeLockPromise = requestWakeLock()
    const startBlock = async segmentId => {
      if (routineRunRef.current !== runId) return
      if (warmupId === 'drekxelRoutine') {
        setIsBlockTransitioning(true)
        await announce(t('singing.blockAnnouncement', {
          exercise: t(`warmup.drekxelRoutine.segment.${segmentId}.speech`)
        }), speechLocale)
        if (routineRunRef.current !== runId) return
      }
      setIsBlockTransitioning(false)
      const started = await warmup.start({
        warmupId,
        tonicMidi: profileTonicMidi,
        scaleType,
        keyCount,
        segmentId,
        tempo,
        onComplete: () => {
          if (routineRunRef.current !== runId) return
          const nextSegmentId = warmupId === 'drekxelRoutine'
            ? getNextDrekxelSegmentId(segmentId)
            : null

          if (nextSegmentId) {
            setDrekxelSegmentId(nextSegmentId)
            setIsBlockTransitioning(true)
            scheduleBlockTransition(() => void startBlock(nextSegmentId), 60000 / tempo)
          } else {
            void releaseWakeLock()
          }
        }
      })
      if (!started && routineRunRef.current === runId) {
        setIsBlockTransitioning(false)
        void releaseWakeLock()
      }
    }

    await startBlock(activeSegmentId)
    await wakeLockPromise
  }

  const handleWarmupChange = nextWarmupId => {
    routineRunRef.current += 1
    clearBlockTransitions()
    cancelAnnouncement()
    setIsBlockTransitioning(false)
    stopWarmup()
    setSeekPreview(null)
    seekPreviewRef.current = null
    setWarmupId(nextWarmupId)
  }

  const handleSegmentChange = segmentId => {
    routineRunRef.current += 1
    clearBlockTransitions()
    cancelAnnouncement()
    setIsBlockTransitioning(false)
    stopWarmup()
    setSeekPreview(null)
    seekPreviewRef.current = null
    setDrekxelSegmentId(segmentId)
  }

  const updateSeekPreview = value => {
    const nextStep = Number(value)
    seekPreviewRef.current = nextStep
    setSeekPreview(nextStep)
  }

  const commitSeek = () => {
    const nextStep = seekPreviewRef.current
    if (nextStep === null) return

    const wasRunning = warmup.isRunning
    seekPreviewRef.current = null
    setSeekPreview(null)
    if (warmup.seek(nextStep - 1) && !wasRunning) void requestWakeLock()
  }

  const currentEvent = warmup.currentEvent
  const currentSegmentId = currentEvent?.segmentId
  const currentTonicPc = currentEvent ? currentEvent.cycleTonicMidi % 12 : profileTonicMidi % 12
  const solfegeLabel = currentEvent
    ? labelForMidi(currentEvent.midi, 'solfege', currentTonicPc, scaleType)
    : '—'
  const letterLabel = currentEvent
    ? displayNoteName(labelForMidi(currentEvent.midi, 'letter', currentTonicPc, scaleType))
    : '—'
  const primaryLabel = isBlockTransitioning ? '…' : notation === 'solfege' ? solfegeLabel : letterLabel
  const secondaryLabel = isBlockTransitioning ? '—' : notation === 'solfege' ? letterLabel : solfegeLabel

  return (
    <section className="singing-practice" aria-labelledby="singing-heading">
      <div className="section-intro">
        <p className="eyebrow">{t('singing.eyebrow')}</p>
        <h2 id="singing-heading">{t('singing.title')}</h2>
        <p>{t('singing.intro')}</p>
      </div>

      <fieldset className="warmup-picker" disabled={warmup.isRunning || isBlockTransitioning}>
        <legend>{t('singing.choose')}</legend>
        <div className="warmup-grid">
          {VOCAL_WARMUPS.map(option => (
            <label
              key={option.id}
              className={`warmup-card ${option.segments ? 'routine' : ''} ${warmupId === option.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="warmup"
                value={option.id}
                checked={warmupId === option.id}
                onChange={() => handleWarmupChange(option.id)}
              />
              <strong>{t(`warmup.${option.id}.label`)}</strong>
              <span>{t(`warmup.${option.id}.description`)}</span>
              <small>{option.segments
                ? t(`warmup.${option.id}.blocks`)
                : t('singing.singOn', { syllable: option.syllable })}</small>
            </label>
          ))}
        </div>
        {warmupId === 'drekxelRoutine' && (
          <p className="routine-source">
            {t('warmup.drekxelRoutine.source')}{' '}
            <a href="https://www.youtube.com/watch?v=rgP_zKTvlE8" target="_blank" rel="noreferrer">
              {t('warmup.drekxelRoutine.sourceLink')}
            </a>.
          </p>
        )}
      </fieldset>

      {warmupId === 'drekxelRoutine' && (
        <fieldset className="routine-block-picker" disabled={warmup.isRunning || isBlockTransitioning}>
          <legend>{t('warmup.drekxelRoutine.chooseBlock')}</legend>
          <p className="routine-flow">{t('warmup.drekxelRoutine.flow')}</p>
          <div className="routine-block-grid">
            {DREKXEL_ROUTINE_SEGMENTS.map(segment => (
              <label
                key={segment.id}
                className={`routine-block ${drekxelSegmentId === segment.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="drekxel-block"
                  value={segment.id}
                  checked={drekxelSegmentId === segment.id}
                  onChange={() => handleSegmentChange(segment.id)}
                />
                <strong>{t(`warmup.drekxelRoutine.segment.${segment.id}.label`)}</strong>
                <span>{t(`warmup.drekxelRoutine.segment.${segment.id}.prompt`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="warmup-options" disabled={warmup.isRunning || isBlockTransitioning}>
        <legend>{t(warmupId === 'drekxelRoutine' ? 'singing.optionsAfterBlock' : 'singing.options')}</legend>
        <label>
          {t('singing.voiceProfile')}
          <select value={voiceProfile} onChange={event => setVoiceProfile(event.target.value)}>
            {Object.keys(VOICE_PROFILES).map(profileId => (
              <option key={profileId} value={profileId}>{t(`singing.voiceProfile.${profileId}`)}</option>
            ))}
          </select>
          <small>{t('singing.voiceProfile.range', {
            lowest: previewRange.lowest,
            highest: previewRange.highest
          })}</small>
        </label>
        <label>
          {t('singing.tempo')}
          <select value={tempo} onChange={event => setTempo(Number(event.target.value))}>
            {WARMUP_TEMPOS.map(option => (
              <option key={option.value} value={option.value}>{t(`tempo.${option.value}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('singing.keys')}
          <select value={keyCount} onChange={event => setKeyCount(Number(event.target.value))}>
            {WARMUP_KEY_COUNTS.map(value => (
              <option key={value} value={value}>{t('singing.keyCount', { count: value })}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="warmup-player">
        <div className="warmup-now" aria-live="polite">
          <span className="muted">{isBlockTransitioning
            ? t('singing.blockAnnouncement', {
                exercise: t(`warmup.drekxelRoutine.segment.${drekxelSegmentId}.speech`)
              })
            : warmup.isRunning
            ? currentSegmentId
              ? t(`warmup.drekxelRoutine.segment.${currentSegmentId}.prompt`)
              : t('singing.sing', { syllable: selectedWarmup.syllable })
            : t('singing.currentNote')}</span>
          <strong>{primaryLabel}</strong>
          <span>{secondaryLabel}</span>
          {currentEvent && !isBlockTransitioning && (
            <>
              {currentSegmentId && (
                <small className="warmup-segment-name">
                  {t(`warmup.drekxelRoutine.segment.${currentSegmentId}.label`)}
                </small>
              )}
              <small>
                {t('singing.keyProgress', {
                  current: currentEvent.cycleIndex + 1,
                  total: keyCount,
                  key: displayNoteName(getTonicName(currentTonicPc, scaleType))
                })}
              </small>
            </>
          )}
        </div>

        <div className="warmup-transport">
          <button
            type="button"
            className="primary-button"
            onClick={handleStart}
            disabled={!audio.isReady}
          >
            {warmup.isRunning || isBlockTransitioning
              ? t('singing.stop')
              : audio.isReady ? t('singing.start') : t('singing.loading')}
          </button>
          <label className="seek-control">
            <span>{t('singing.seekHelp')}</span>
            <input
              className="progress-slider"
              type="range"
              min="1"
              max={Math.max(1, warmup.totalSteps)}
              value={seekPreview ?? Math.max(1, warmup.step)}
              disabled={warmup.totalSteps === 0}
              aria-label={t('singing.seek')}
              aria-valuetext={t('singing.noteProgress', {
                current: seekPreview ?? Math.max(1, warmup.step),
                total: warmup.totalSteps
              })}
              style={{ '--progress': `${warmup.totalSteps
                ? (((seekPreview ?? warmup.step) - 1) / Math.max(1, warmup.totalSteps - 1)) * 100
                : 0}%` }}
              onChange={event => updateSeekPreview(event.target.value)}
              onPointerUp={commitSeek}
              onKeyUp={commitSeek}
              onBlur={commitSeek}
            />
          </label>
          <p className="warmup-status">
            {isBlockTransitioning
              ? t('singing.nextBlock', {
                  block: t(`warmup.drekxelRoutine.segment.${drekxelSegmentId}.label`)
                })
              : warmup.completed
              ? t('singing.complete')
              : warmup.isRunning
                ? t('singing.noteProgress', { current: warmup.step, total: warmup.totalSteps })
                : t('singing.ready')}
          </p>
        </div>
      </div>

      <div className="voice-safety" role="note">
        <strong>{t('singing.safetyTitle')}</strong> {t('singing.safety')}
      </div>
    </section>
  )
}
