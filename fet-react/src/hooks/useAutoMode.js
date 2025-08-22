import { useState, useRef, useCallback } from 'react'
import { labelForMidi } from '../utils/helpers.js'
import { NOTES } from '../utils/constants.js'

export function useAutoMode() {
  const [isRunning, setIsRunning] = useState(false)
  const [interval, setInterval] = useState(5000)
  const [showAnswer, setShowAnswer] = useState(true)
  const [sayAnswer, setSayAnswer] = useState(true)
  const autoTimerRef = useRef(null)
  const isRunningRef = useRef(false)

  const start = useCallback(() => {
    console.log('🎯 useAutoMode.start() called')
    isRunningRef.current = true
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    isRunningRef.current = false
    setIsRunning(false)
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [])

  const runAutoRound = useCallback((targetMidi, playCadence, playTone, onComplete, onUIUpdate) => {
    console.log('🎼 useAutoMode.runAutoRound called, isRunning:', isRunning, 'target:', targetMidi)

    const endCad = playCadence()
    const tTarget = endCad + 0.12
    playTone(targetMidi, tTarget, 0.9, "piano", 0.18)

    // Use Tone context for timing like in the original
    import('tone').then(Tone => {
      const ctx = Tone.getContext().rawContext
      const enableAtMs = Math.max(0, (tTarget - ctx.currentTime) * 1000) + 200
      console.log('⏱️ Auto mode timing delay:', enableAtMs)
      
      setTimeout(() => {
        console.log('🎯 Showing auto answer...')
        onUIUpdate?.("🎧 Listen...", false, targetMidi)
        
        setTimeout(() => {
          const result = showAutoAnswer(targetMidi, playTone, onComplete)
          onUIUpdate?.(result.message, result.shouldHighlight, result.targetMidi)
        }, 2000)
      }, enableAtMs)
    })
  }, [isRunning, showAnswer])

  const showAutoAnswer = useCallback((targetMidi, playTone, onComplete) => {
    console.log('🎯 showAutoAnswer called, isRunning:', isRunning, 'isRunningRef:', isRunningRef.current, 'target:', targetMidi)
    if (!isRunningRef.current) {
      console.log('❌ showAutoAnswer: Auto mode not running, aborting')
      return
    }

    const targetLabel = labelForMidi(targetMidi, 'solfege') // Default to solfege for auto mode
    console.log('✨ Target label:', targetLabel)
    
    let speechDuration = 0
    let resolutionDuration = 0

    // Say answer if enabled
    console.log('🗣️ Say answer check:', {sayAnswer, hasSpeechSynthesis: 'speechSynthesis' in window})
    if (sayAnswer && 'speechSynthesis' in window) {
      console.log('🗣️ Speaking:', targetLabel)
      const utterance = new SpeechSynthesisUtterance(targetLabel)
      utterance.rate = 0.8
      utterance.pitch = 1.0
      speechDuration = Math.max(1000, targetLabel.length * 200)
      speechSynthesis.speak(utterance)
    } else {
      console.log('🗣️ Not speaking - sayAnswer:', sayAnswer, 'speechSynthesis available:', 'speechSynthesis' in window)
    }

    // Play resolution (always enabled in auto mode for now)
    const resolutionDelay = speechDuration + 300
    
    setTimeout(() => {
      console.log('🎵 Playing resolution, isRunning:', isRunning, 'isRunningRef:', isRunningRef.current)
      if (isRunningRef.current) {
        // Import Tone for timing
        import('tone').then(Tone => {
          const ctx = Tone.getContext().rawContext
          const t0 = ctx.currentTime + 0.1
          playTone(targetMidi, t0, 0.45, 'piano', 0.16)
          playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
        })
      }
    }, resolutionDelay)
    
    resolutionDuration = resolutionDelay + 1400

    // Schedule next round
    const usedTime = 2000 + Math.max(speechDuration, 0) + resolutionDuration + 1500
    const delay = Math.max(3000, interval - usedTime)

    autoTimerRef.current = setTimeout(() => {
      console.log('🔄 Scheduling next round, isRunning:', isRunning, 'isRunningRef:', isRunningRef.current, 'delay was:', delay)
      if (isRunningRef.current) {
        console.log('✅ Calling onComplete to continue cycle')
        onComplete?.()
      } else {
        console.log('❌ Auto mode stopped, not continuing')
      }
    }, delay)

    return {
      message: showAnswer ? `✨ Answer: ${targetLabel}` : "🎵 (Answer hidden)",
      shouldHighlight: showAnswer,
      targetMidi
    }
  }, [isRunning, interval, showAnswer, sayAnswer])

  return {
    isRunning,
    isRunningRef,
    interval,
    showAnswer,
    sayAnswer,
    setInterval,
    setShowAnswer,
    setSayAnswer,
    start,
    stop,
    runAutoRound,
    showAutoAnswer
  }
}