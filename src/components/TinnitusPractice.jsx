import { useEffect, useMemo, useState } from 'react'
import { useNotchedAudio } from '../hooks/useNotchedAudio.js'
import { loadFromStorage, saveToStorage } from '../utils/helpers.js'
import {
  clampTinnitusFrequency,
  formatAudioTime,
  formatFrequency,
  frequencyToSlider,
  getNotchBounds,
  MAX_TINNITUS_FREQUENCY,
  MIN_TINNITUS_FREQUENCY,
  sliderToFrequency
} from '../utils/notchedAudio.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const STORAGE_PREFIX = 'fet-tinnitus-'
const getInitialVolume = () => {
  const savedVolume = Number(loadFromStorage(`${STORAGE_PREFIX}volume`, 0.35))
  return Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : 0.35
}

export function TinnitusPractice({ screenWakeLock }) {
  const { t } = useI18n()
  const [frequency, setFrequency] = useState(() => (
    clampTinnitusFrequency(loadFromStorage(`${STORAGE_PREFIX}frequency`, 6000))
  ))
  const [frequencyDraft, setFrequencyDraft] = useState(() => String(frequency))
  const [widthInOctaves, setWidthInOctaves] = useState(() => (
    Number(loadFromStorage(`${STORAGE_PREFIX}width`, 1)) || 1
  ))
  const [volume, setVolume] = useState(getInitialVolume)
  const [filterEnabled, setFilterEnabled] = useState(true)
  const [infoVisible, setInfoVisible] = useState(false)
  const audio = useNotchedAudio({ frequency, widthInOctaves, filterEnabled, volume, translate: t })
  const notchBounds = useMemo(() => getNotchBounds(frequency, widthInOctaves), [frequency, widthInOctaves])
  const notchMarker = useMemo(() => {
    const sliderMin = frequencyToSlider(MIN_TINNITUS_FREQUENCY)
    const sliderMax = frequencyToSlider(MAX_TINNITUS_FREQUENCY)
    const spectrumOctaves = sliderMax - sliderMin
    const center = ((frequencyToSlider(frequency) - sliderMin) / spectrumOctaves) * 100
    const width = Math.max(8, (widthInOctaves / spectrumOctaves) * 100)
    return { left: Math.max(0, Math.min(100 - width, center - width / 2)), width }
  }, [frequency, widthInOctaves])
  const requestWakeLock = screenWakeLock.request
  const releaseWakeLock = screenWakeLock.release

  useEffect(() => saveToStorage(`${STORAGE_PREFIX}frequency`, frequency), [frequency])
  useEffect(() => saveToStorage(`${STORAGE_PREFIX}width`, widthInOctaves), [widthInOctaves])
  useEffect(() => saveToStorage(`${STORAGE_PREFIX}volume`, volume), [volume])

  useEffect(() => {
    if (!audio.isPlaying) void releaseWakeLock()
  }, [audio.isPlaying, releaseWakeLock])

  useEffect(() => () => void releaseWakeLock(), [releaseWakeLock])

  const handlePlayback = async () => {
    if (audio.isPlaying) {
      audio.pause()
      void releaseWakeLock()
      return
    }
    const wakeLockPromise = requestWakeLock()
    const started = await audio.play()
    if (!started) void releaseWakeLock()
    await wakeLockPromise
  }

  return (
    <section className="tinnitus-practice" aria-labelledby="tinnitus-heading">
      <div className="tinnitus-heading-row">
        <div className="section-intro">
          <p className="eyebrow">{t('tinnitus.eyebrow')}</p>
          <h2 id="tinnitus-heading">{t('tinnitus.title')}</h2>
          <p>{t('tinnitus.intro')}</p>
        </div>
        <button type="button" className="evidence-button" onClick={() => setInfoVisible(true)}>
          <span className="experimental-dot" aria-hidden="true" />
          {t('tinnitus.evidence')}
        </button>
      </div>

      <div className="tinnitus-steps">
        <section className="tinnitus-step" aria-labelledby="frequency-heading">
          <span className="step-number" aria-hidden="true">1</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="frequency-heading">{t('tinnitus.match.title')}</h3>
                <p>{t('tinnitus.match.help')}</p>
              </div>
              <strong className="frequency-readout">{formatFrequency(frequency)}</strong>
            </div>

            <input
              className="frequency-slider"
              type="range"
              min={frequencyToSlider(MIN_TINNITUS_FREQUENCY)}
              max={frequencyToSlider(MAX_TINNITUS_FREQUENCY)}
              step="0.01"
              value={frequencyToSlider(frequency)}
              onChange={event => {
                const nextFrequency = sliderToFrequency(event.target.value)
                setFrequency(nextFrequency)
                setFrequencyDraft(String(nextFrequency))
              }}
              aria-label={t('tinnitus.frequency')}
            />
            <div className="frequency-scale" aria-hidden="true">
              <span>125 Hz</span><span>1 kHz</span><span>4 kHz</span><span>12 kHz</span>
            </div>

            <div className="frequency-actions">
              <label>
                {t('tinnitus.exact')}
                <span className="frequency-input">
                  <input
                    type="number"
                    min={MIN_TINNITUS_FREQUENCY}
                    max={MAX_TINNITUS_FREQUENCY}
                    step="10"
                    value={frequencyDraft}
                    onChange={event => setFrequencyDraft(event.target.value)}
                    onBlur={() => {
                      const nextFrequency = clampTinnitusFrequency(frequencyDraft)
                      setFrequency(nextFrequency)
                      setFrequencyDraft(String(nextFrequency))
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                  />
                  Hz
                </span>
              </label>
              <button type="button" onClick={audio.playReferenceTone} disabled={!audio.isSupported}>
                {t('tinnitus.reference')}
              </button>
            </div>
            <p className="inline-safety">{t('tinnitus.match.safety')}</p>
          </div>
        </section>

        <section className="tinnitus-step" aria-labelledby="music-heading">
          <span className="step-number" aria-hidden="true">2</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="music-heading">{t('tinnitus.music.title')}</h3>
                <p>{t('tinnitus.music.privacy')}</p>
              </div>
            </div>

            <label className="audio-file-picker">
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
                onChange={event => audio.loadFile(event.target.files?.[0])}
              />
              <span aria-hidden="true">＋</span>
              <strong>{audio.fileName || t('tinnitus.file.select')}</strong>
              <small>{audio.fileName ? t('tinnitus.file.another') : t('tinnitus.file.formats')}</small>
            </label>
          </div>
        </section>

        <section className="tinnitus-step" aria-labelledby="filter-heading">
          <span className="step-number" aria-hidden="true">3</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="filter-heading">{t('tinnitus.filter.title')}</h3>
                <p>{t('tinnitus.filter.help')}</p>
              </div>
              <label className="compact-toggle">
                <input
                  type="checkbox"
                  checked={filterEnabled}
                  onChange={event => setFilterEnabled(event.target.checked)}
                />
                {t('tinnitus.filter.state', { state: t(filterEnabled ? 'tinnitus.filter.on' : 'tinnitus.filter.off') })}
              </label>
            </div>

            <div className="notch-visual" aria-label={t('tinnitus.notchRange', {
              lower: formatFrequency(notchBounds.lower),
              upper: formatFrequency(notchBounds.upper)
            })}>
              <div className="spectrum-bars" aria-hidden="true">
                {Array.from({ length: 32 }, (_, index) => <span key={index} />)}
              </div>
              <span
                className="notch-gap"
                style={{ left: `${notchMarker.left}%`, width: `${notchMarker.width}%` }}
                aria-hidden="true"
              />
              <strong>{formatFrequency(notchBounds.lower)} – {formatFrequency(notchBounds.upper)}</strong>
            </div>

            <div className="filter-options">
              <label>
                {t('tinnitus.width')}
                <select value={widthInOctaves} onChange={event => setWidthInOctaves(Number(event.target.value))}>
                  <option value="0.5">{t('tinnitus.width.narrow')}</option>
                  <option value="1">{t('tinnitus.width.default')}</option>
                  <option value="1.5">{t('tinnitus.width.wide')}</option>
                </select>
              </label>
              <label>
                {t('tinnitus.volume', { volume: Math.round(volume * 100) })}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={event => setVolume(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="notched-player">
              <button
                type="button"
                className="primary-button"
                onClick={handlePlayback}
                disabled={!audio.fileName || !audio.isSupported}
              >
                {audio.isPlaying ? t('tinnitus.pause') : t('tinnitus.play')}
              </button>
              <div className="audio-timeline">
                <input
                  type="range"
                  min="0"
                  max={audio.duration || 0}
                  step="0.1"
                  value={Math.min(audio.currentTime, audio.duration || 0)}
                  onChange={event => audio.seek(Number(event.target.value))}
                  aria-label={t('tinnitus.position')}
                  disabled={!audio.duration}
                />
                <span>{formatAudioTime(audio.currentTime)} / {formatAudioTime(audio.duration)}</span>
              </div>
            </div>

            {audio.error && <p className="audio-error" role="alert">{audio.error}</p>}
          </div>
        </section>
      </div>

      <p className="tinnitus-compact-note">
        {t('tinnitus.compactDisclaimer')}{' '}
        <button type="button" onClick={() => setInfoVisible(true)}>{t('tinnitus.whenNotUse')}</button>
      </p>

      {infoVisible && <TinnitusInfoDialog onClose={() => setInfoVisible(false)} />}
    </section>
  )
}

function TinnitusInfoDialog({ onClose }) {
  const { t } = useI18n()
  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="tinnitus-info-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="tinnitus-info-modal" role="dialog" aria-modal="true" aria-labelledby="tinnitus-info-heading">
        <header className="settings-header">
          <div>
            <p className="eyebrow">{t('tinnitus.info.eyebrow')}</p>
            <h2 id="tinnitus-info-heading">{t('tinnitus.info.title')}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label={t('tinnitus.info.close')}>×</button>
        </header>
        <div className="tinnitus-info-content">
          <section>
            <h3>{t('tinnitus.info.evidenceTitle')}</h3>
            <p>{t('tinnitus.info.evidenceText')}</p>
          </section>
          <section>
            <h3>{t('tinnitus.info.fitTitle')}</h3>
            <p>{t('tinnitus.info.fitText')}</p>
          </section>
          <section className="medical-warning">
            <h3>{t('tinnitus.info.medicalTitle')}</h3>
            <p>{t('tinnitus.info.medicalText')}</p>
          </section>
          <section>
            <h3>{t('tinnitus.info.safeTitle')}</h3>
            <p>{t('tinnitus.info.safeText')}</p>
          </section>
          <details className="evidence-sources">
            <summary>{t('tinnitus.info.sources')}</summary>
            <ul>
              <li><a href="https://pubmed.ncbi.nlm.nih.gov/38847844/" target="_blank" rel="noreferrer">{t('tinnitus.info.review')}</a></li>
              <li><a href="https://healthquality.va.gov/HEALTHQUALITY/guidelines/CD/tinnitus/VADoD-CPG-Tinnitus-Full-CPG-2024_Final_508.pdf" target="_blank" rel="noreferrer">{t('tinnitus.info.guideline')}</a></li>
              <li><a href="https://www.nice.org.uk/guidance/ng155/chapter/Recommendations" target="_blank" rel="noreferrer">{t('tinnitus.info.nice')}</a></li>
              <li><a href="https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening" target="_blank" rel="noreferrer">{t('tinnitus.info.who')}</a></li>
            </ul>
          </details>
        </div>
      </section>
    </div>
  )
}
