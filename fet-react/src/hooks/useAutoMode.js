import { useState, useRef, useCallback } from 'react'
import { labelForMidi } from '../utils/helpers.js'
import { NOTES } from '../utils/constants.js'

export function useAutoMode() {
  const [isRunning, setIsRunning] = useState(false)
  const [interval, setInterval] = useState(5000)
  const [showAnswer, setShowAnswer] = useState(true)
  const [sayAnswer, setSayAnswer] = useState(false)
  const autoTimerRef = useRef(null)

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [])

  const runAutoRound = useCallback((targetMidi, playCadence, playTone, onComplete) => {
    if (!isRunning) return

    const endCad = playCadence()
    const tTarget = endCad + 0.12
    playTone(targetMidi, tTarget, 0.9, "piano", 0.18)

    const listenDelay = Math.max(0, (tTarget - performance.now() / 1000) * 1000) + 200
    
    setTimeout(() => {
      if (!isRunning) return
      
      setTimeout(() => {
        showAutoAnswer(targetMidi, playTone, onComplete)
      }, 2000)
    }, listenDelay)
  }, [isRunning])

  const showAutoAnswer = useCallback((targetMidi, playTone, onComplete) => {
    if (!isRunning) return

    const targetLabel = labelForMidi(targetMidi, 'solfege') // Default to solfege for auto mode
    
    let speechDuration = 0
    let resolutionDuration = 0

    // Say answer if enabled
    if (sayAnswer && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(targetLabel)
      utterance.rate = 0.8
      utterance.pitch = 1.0
      speechDuration = Math.max(1000, targetLabel.length * 200)
      speechSynthesis.speak(utterance)
    }

    // Play resolution (always enabled in auto mode for now)
    const resolutionDelay = speechDuration + 300
    
    setTimeout(() => {
      if (isRunning) {
        const t0 = performance.now() / 1000 + 0.1
        playTone(targetMidi, t0, 0.45, 'piano', 0.16)
        playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
      }
    }, resolutionDelay)
    
    resolutionDuration = resolutionDelay + 1400

    // Schedule next round
    const usedTime = 2000 + Math.max(speechDuration, 0) + resolutionDuration + 1500
    const delay = Math.max(3000, interval - usedTime)

    autoTimerRef.current = setTimeout(() => {
      if (isRunning) {
        onComplete?.()
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