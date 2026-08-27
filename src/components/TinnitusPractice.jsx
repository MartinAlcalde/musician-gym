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

const STORAGE_PREFIX = 'fet-tinnitus-'
const getInitialVolume = () => {
  const savedVolume = Number(loadFromStorage(`${STORAGE_PREFIX}volume`, 0.35))
  return Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : 0.35
}

export function TinnitusPractice({ screenWakeLock }) {
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
  const audio = useNotchedAudio({ frequency, widthInOctaves, filterEnabled, volume })
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
          <p className="eyebrow">Experimental sound tool</p>
          <h2 id="tinnitus-heading">Personalized notched music</h2>
          <p>Remove a band around a tonal tinnitus frequency while your music plays locally.</p>
        </div>
        <button type="button" className="evidence-button" onClick={() => setInfoVisible(true)}>
          <span className="experimental-dot" aria-hidden="true" />
          Evidence &amp; safety
        </button>
      </div>

      <div className="tinnitus-steps">
        <section className="tinnitus-step" aria-labelledby="frequency-heading">
          <span className="step-number" aria-hidden="true">1</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="frequency-heading">Match the dominant tone</h3>
                <p>Adjust carefully until the reference resembles the main pitch you hear.</p>
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
              aria-label="Tinnitus frequency"
            />
            <div className="frequency-scale" aria-hidden="true">
              <span>125 Hz</span><span>1 kHz</span><span>4 kHz</span><span>12 kHz</span>
            </div>

            <div className="frequency-actions">
              <label>
                Exact frequency
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
                ♪ Play 1-second reference
              </button>
            </div>
            <p className="inline-safety">Start with your device volume very low. Frequency matching can vary, so repeat it on different days or confirm it with an audiologist.</p>
          </div>
        </section>

        <section className="tinnitus-step" aria-labelledby="music-heading">
          <span className="step-number" aria-hidden="true">2</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="music-heading">Choose your music</h3>
                <p>The file stays on this device and is never uploaded.</p>
              </div>
            </div>

            <label className="audio-file-picker">
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
                onChange={event => audio.loadFile(event.target.files?.[0])}
              />
              <span aria-hidden="true">＋</span>
              <strong>{audio.fileName || 'Select an audio file'}</strong>
              <small>{audio.fileName ? 'Choose another file' : 'MP3, M4A, WAV, OGG, or another browser-supported format'}</small>
            </label>
          </div>
        </section>

        <section className="tinnitus-step" aria-labelledby="filter-heading">
          <span className="step-number" aria-hidden="true">3</span>
          <div className="step-content">
            <div className="step-heading">
              <div>
                <h3 id="filter-heading">Listen with the notch</h3>
                <p>The selected band is attenuated in real time. Nothing is permanently changed.</p>
              </div>
              <label className="compact-toggle">
                <input
                  type="checkbox"
                  checked={filterEnabled}
                  onChange={event => setFilterEnabled(event.target.checked)}
                />
                Filter {filterEnabled ? 'on' : 'off'}
              </label>
            </div>

            <div className="notch-visual" aria-label={`Notch from ${formatFrequency(notchBounds.lower)} to ${formatFrequency(notchBounds.upper)}`}>
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
                Notch width
                <select value={widthInOctaves} onChange={event => setWidthInOctaves(Number(event.target.value))}>
                  <option value="0.5">½ octave · Narrow</option>
                  <option value="1">1 octave · Research default</option>
                  <option value="1.5">1½ octaves · Wide</option>
                </select>
              </label>
              <label>
                Player volume · {Math.round(volume * 100)}%
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
                {audio.isPlaying ? '■ Pause' : '▶ Play filtered music'}
              </button>
              <div className="audio-timeline">
                <input
                  type="range"
                  min="0"
                  max={audio.duration || 0}
                  step="0.1"
                  value={Math.min(audio.currentTime, audio.duration || 0)}
                  onChange={event => audio.seek(Number(event.target.value))}
                  aria-label="Playback position"
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
        Experimental—not a cure or medical advice. Stop if symptoms worsen.{' '}
        <button type="button" onClick={() => setInfoVisible(true)}>When should I not use this?</button>
      </p>

      {infoVisible && <TinnitusInfoDialog onClose={() => setInfoVisible(false)} />}
    </section>
  )
}

function TinnitusInfoDialog({ onClose }) {
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
            <p className="eyebrow">Evidence &amp; safety</p>
            <h2 id="tinnitus-info-heading">Before using notched music</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close evidence and safety information">×</button>
        </header>
        <div className="tinnitus-info-content">
          <section>
            <h3>What the evidence says</h3>
            <p>This experimental method removes sound around a matched tinnitus frequency. The proposed mechanism is lateral inhibition—not the brain “filling in” the missing music. Clinical results are mixed, and current guidelines consider the evidence insufficient to recommend for or against it.</p>
          </section>
          <section>
            <h3>Who it may fit</h3>
            <p>Research has mainly studied adults with chronic, subjective, tonal tinnitus and a reasonably stable dominant pitch. It is not designed for pulsatile, noise-like, or rapidly changing tinnitus.</p>
          </section>
          <section className="medical-warning">
            <h3>Get medical advice first</h3>
            <p>Do not use this as a substitute for evaluation. Seek prompt care for tinnitus synchronized with your heartbeat, sudden or one-sided hearing loss, recent head or acoustic trauma, severe dizziness, neurological symptoms, or sudden pulsatile tinnitus.</p>
          </section>
          <section>
            <h3>Listen safely</h3>
            <p>Keep device volume at 60% or lower, begin very quietly, take breaks, and never increase volume to compensate for the removed frequencies. Stop if tinnitus, discomfort, dizziness, or sound sensitivity increases.</p>
          </section>
          <details className="evidence-sources">
            <summary>Research and clinical sources</summary>
            <ul>
              <li><a href="https://pubmed.ncbi.nlm.nih.gov/38847844/" target="_blank" rel="noreferrer">2024 systematic review and meta-analysis</a></li>
              <li><a href="https://healthquality.va.gov/HEALTHQUALITY/guidelines/CD/tinnitus/VADoD-CPG-Tinnitus-Full-CPG-2024_Final_508.pdf" target="_blank" rel="noreferrer">2024 VA/DoD tinnitus guideline</a></li>
              <li><a href="https://www.nice.org.uk/guidance/ng155/chapter/Recommendations" target="_blank" rel="noreferrer">NICE tinnitus guidance</a></li>
              <li><a href="https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening" target="_blank" rel="noreferrer">WHO safe-listening guidance</a></li>
            </ul>
          </details>
        </div>
      </section>
    </div>
  )
}
