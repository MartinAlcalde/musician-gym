import { useState, useRef, useEffect, useCallback } from 'react'
import { MIDI_TO_NAME, NOTES } from '../utils/constants.js'

const SAMPLE_NOTES = ['A2', 'A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'C6']

export function useAudio() {
  const [isReady, setIsReady] = useState(false)
  const toneRef = useRef(null)
  const samplerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let sampleScript = null

    const createSampler = Tone => {
      if (cancelled || !window.PIANO_BASE64) return

      const urls = Object.fromEntries(
        SAMPLE_NOTES.map(note => [note, window.PIANO_BASE64[note]])
      )

      samplerRef.current = new Tone.Sampler({
        urls,
        release: 1.2,
        onload: () => {
          if (!cancelled) setIsReady(true)
        },
        onerror: error => {
          console.error('Error loading piano samples:', error)
          if (!cancelled) setIsReady(false)
        }
      }).toDestination()
    }

    const initAudio = async () => {
      try {
        const Tone = await import('tone')
        if (cancelled) return

        toneRef.current = Tone
        if (window.PIANO_BASE64) {
          createSampler(Tone)
          return
        }

        sampleScript = document.createElement('script')
        sampleScript.src = `${import.meta.env.BASE_URL}piano.base64.js`
        sampleScript.onload = () => createSampler(Tone)
        sampleScript.onerror = () => {
          if (!cancelled) setIsReady(false)
        }
        document.head.appendChild(sampleScript)
      } catch (error) {
        console.error('Audio initialization error:', error)
        if (!cancelled) setIsReady(false)
      }
    }

    void initAudio()

    return () => {
      cancelled = true
      sampleScript?.remove()
      samplerRef.current?.dispose()
      samplerRef.current = null
      toneRef.current = null
    }
  }, [])

  const getCurrentTime = useCallback(() => {
    return toneRef.current?.getContext().rawContext.currentTime ?? null
  }, [])

  const playTone = useCallback((midi, when, duration = 0.6, _type = 'piano', gain = 0.15) => {
    const Tone = toneRef.current
    const sampler = samplerRef.current
    const name = MIDI_TO_NAME[midi]
    if (!Tone || !sampler || !name) return

    const currentTime = Tone.getContext().rawContext.currentTime
    const delay = Math.max(0, when - currentTime)
    const toneTime = Tone.now() + delay
    const velocity = Math.max(0.05, Math.min(1, gain * 6))
    sampler.triggerAttackRelease(name, duration, toneTime, velocity)
  }, [])

  const playChord = useCallback((midis, when, duration = 0.7, type = 'piano', chordGain = 0.24) => {
    const perVoice = chordGain / Math.max(1, midis.length)
    midis.forEach(midi => playTone(midi, when, duration, type, perVoice))
  }, [playTone])

  const playCadence = useCallback(() => {
    const currentTime = getCurrentTime()
    if (currentTime === null) return 0

    const startTime = currentTime + 0.05
    const step = 0.65

    playChord([NOTES.C4, NOTES.E4, NOTES.G4], startTime, step)
    playChord([NOTES.C4, NOTES.F4, NOTES.A4], startTime + step, step)
    playChord([NOTES.B3, NOTES.D4, NOTES.G4], startTime + 2 * step, step)
    playChord([NOTES.C4, NOTES.E4, NOTES.G4], startTime + 3 * step, step)

    return startTime + 4 * step
  }, [getCurrentTime, playChord])

  const startAudioContext = useCallback(async () => {
    const Tone = toneRef.current
    if (!Tone) return false

    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }
    return true
  }, [])

  return {
    isReady,
    getCurrentTime,
    playTone,
    playChord,
    playCadence,
    startAudioContext
  }
}
