import { useState, useRef, useEffect, useCallback } from 'react'
import { getCadenceChords, midiToNoteName } from '../utils/helpers.js'

const SAMPLE_NOTES = ['A2', 'A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'C6']

export function useAudio() {
  const [isReady, setIsReady] = useState(false)
  const toneRef = useRef(null)
  const samplerRef = useRef(null)
  const guitarVoicesRef = useRef([])
  const nextGuitarVoiceRef = useRef(0)

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
        guitarVoicesRef.current = Array.from({ length: 6 }, () => (
          new Tone.PluckSynth({
            attackNoise: 1.4,
            dampening: 3600,
            resonance: 0.82,
            release: 0.55
          }).toDestination()
        ))
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
      guitarVoicesRef.current.forEach(voice => voice.dispose())
      guitarVoicesRef.current = []
      nextGuitarVoiceRef.current = 0
      toneRef.current = null
    }
  }, [])

  const getCurrentTime = useCallback(() => {
    return toneRef.current?.getContext().rawContext.currentTime ?? null
  }, [])

  const playTone = useCallback((midi, when, duration = 0.6, type = 'piano', gain = 0.15) => {
    const Tone = toneRef.current
    const name = midiToNoteName(midi)
    if (!Tone || !name) return

    const currentTime = Tone.getContext().rawContext.currentTime
    const delay = Math.max(0, when - currentTime)
    const toneTime = Tone.now() + delay
    const velocity = Math.max(0.05, Math.min(1, gain * 6))

    if (type === 'guitar') {
      const voices = guitarVoicesRef.current
      if (!voices.length) return
      const voice = voices[nextGuitarVoiceRef.current % voices.length]
      nextGuitarVoiceRef.current += 1
      voice.volume.setValueAtTime(Tone.gainToDb(velocity), toneTime)
      voice.triggerAttack(name, toneTime)
      voice.triggerRelease(toneTime + duration)
      return
    }

    const sampler = samplerRef.current
    if (!sampler) return
    sampler.triggerAttackRelease(name, duration, toneTime, velocity)
  }, [])

  const playChord = useCallback((midis, when, duration = 0.7, type = 'piano', chordGain = 0.24) => {
    const perVoice = chordGain / Math.max(1, midis.length)
    midis.forEach((midi, index) => {
      const strumDelay = type === 'guitar' ? index * 0.025 : 0
      playTone(midi, when + strumDelay, duration, type, perVoice)
    })
  }, [playTone])

  const playCadence = useCallback((tonicMidi = 60, scaleType = 'major', type = 'piano') => {
    const currentTime = getCurrentTime()
    if (currentTime === null) return 0

    const startTime = currentTime + 0.05
    const step = 0.65

    getCadenceChords(tonicMidi, scaleType).forEach((chord, index) => {
      playChord(chord, startTime + index * step, step, type)
    })

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
