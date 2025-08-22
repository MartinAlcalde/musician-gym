import { useState, useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { MIDI_TO_NAME, NOTES } from '../utils/constants.js'

export function useAudio() {
  const [isReady, setIsReady] = useState(false)
  const samplerRef = useRef(null)

  useEffect(() => {
    const initAudio = async () => {
      try {
        // Load piano samples from the public file
        const script = document.createElement('script')
        script.src = '/piano.base64.js'
        script.onload = () => {
          if (window.PIANO_BASE64) {
            samplerRef.current = new Tone.Sampler({
              urls: {
                A2: window.PIANO_BASE64.A2,
                A3: window.PIANO_BASE64.A3,
                A4: window.PIANO_BASE64.A4,
                A5: window.PIANO_BASE64.A5,
                C3: window.PIANO_BASE64.C3,
                C4: window.PIANO_BASE64.C4,
                C5: window.PIANO_BASE64.C5,
                C6: window.PIANO_BASE64.C6,
              },
              release: 1.2,
              onload: () => {
                setIsReady(true)
              },
              onerror: (e) => {
                console.error('Error loading piano samples:', e)
                setIsReady(false)
              }
            }).toDestination()
          }
        }
        script.onerror = () => {
          console.error('Failed to load piano samples script')
          setIsReady(false)
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Audio initialization error:', error)
        setIsReady(false)
      }
    }

    initAudio()
  }, [])

  const playTone = useCallback((midi, when, dur = 0.6, type = "sine", gainVal = 0.15) => {
    const name = MIDI_TO_NAME[midi]
    if (!(samplerRef.current && isReady && name)) return
    
    const ctx = Tone.getContext().rawContext
    const delay = Math.max(0, when - ctx.currentTime)
    const t = Tone.now() + delay
    const vel = Math.max(0.05, Math.min(1, gainVal * 6))
    samplerRef.current.triggerAttackRelease(name, dur, t, vel)
  }, [isReady])

  const playChord = useCallback((midis, when, dur = 0.7, type = "piano", chordGain = 0.24) => {
    const perVoice = chordGain / Math.max(1, midis.length)
    midis.forEach(m => playTone(m, when, dur, type, perVoice))
  }, [playTone])

  const playCadence = useCallback(() => {
    const ctx = Tone.getContext().rawContext
    const t0 = ctx.currentTime + 0.05
    const step = 0.65
    
    // I: C major (C4 E4 G4)
    playChord([NOTES.C4, NOTES.E4, NOTES.G4], t0, step, "piano")
    // IV: F major voiced with common tone C4 (C4 F4 A4)
    playChord([NOTES.C4, NOTES.F4, NOTES.A4], t0 + step, step, "piano")
    // V: G major (B3 D4 G4) for smooth motion
    playChord([NOTES.B3, NOTES.D4, NOTES.G4], t0 + 2*step, step, "piano")
    // I: C major return
    playChord([NOTES.C4, NOTES.E4, NOTES.G4], t0 + 3*step, step, "piano")
    
    return t0 + 4*step // end time
  }, [playChord])

  const startAudioContext = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
  }, [])

  return {
    isReady,
    playTone,
    playChord,
    playCadence,
    startAudioContext
  }
}