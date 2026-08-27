import { useCallback, useEffect, useRef, useState } from 'react'
import { labelForMidi } from '../utils/helpers.js'

const ANSWER_DELAY_MS = 2000
const SPEECH_WATCHDOG_MS = 15000
const RESOLUTION_DELAY_MS = 300
const RESOLUTION_DURATION_MS = 1400

const now = () => globalThis.performance?.now?.() ?? Date.now()

export function useAutoMode({
  notation = 'solfege',
  initialInterval = 5000,
  initialShowAnswer = true,
  initialSayAnswer = true
} = {}) {
  const [isRunning, setIsRunning] = useState(false)
  const [interval, setIntervalState] = useState(initialInterval)
  const [showAnswer, setShowAnswerState] = useState(initialShowAnswer)
  const [sayAnswer, setSayAnswerState] = useState(initialSayAnswer)

  const isRunningRef = useRef(false)
  const intervalRef = useRef(interval)
  const showAnswerRef = useRef(showAnswer)
  const sayAnswerRef = useRef(sayAnswer)
  const notationRef = useRef(notation)
  const timersRef = useRef(new Set())
  const utteranceRef = useRef(null)
  const sessionRef = useRef(0)
  const roundRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    notationRef.current = notation
  }, [notation])

  const clearTimer = useCallback((timerId) => {
    if (timerId === null || timerId === undefined) return
    globalThis.clearTimeout(timerId)
    timersRef.current.delete(timerId)
  }, [])

  const clearTimers = useCallback(() => {
    for (const timerId of timersRef.current) {
      globalThis.clearTimeout(timerId)
    }
    timersRef.current.clear()
  }, [])

  const cancelSpeech = useCallback(() => {
    const utterance = utteranceRef.current
    if (utterance) {
      utterance.onend = null
      utterance.onerror = null
      utteranceRef.current = null
    }

    const synthesis = globalThis.speechSynthesis
    if (synthesis) synthesis.cancel()
  }, [])

  const clearPendingWork = useCallback(() => {
    clearTimers()
    cancelSpeech()
  }, [cancelSpeech, clearTimers])

  const isCurrentRound = useCallback((sessionId, roundId) => (
    mountedRef.current &&
    isRunningRef.current &&
    sessionRef.current === sessionId &&
    roundRef.current === roundId
  ), [])

  const schedule = useCallback((callback, delay, sessionId, roundId) => {
    const timerId = globalThis.setTimeout(() => {
      timersRef.current.delete(timerId)
      if (isCurrentRound(sessionId, roundId)) callback()
    }, Math.max(0, delay))

    timersRef.current.add(timerId)
    return timerId
  }, [isCurrentRound])

  const setInterval = useCallback((value) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue) || nextValue < 0) return
    intervalRef.current = nextValue
    setIntervalState(nextValue)
  }, [])

  const setShowAnswer = useCallback((value) => {
    const nextValue = Boolean(value)
    showAnswerRef.current = nextValue
    setShowAnswerState(nextValue)
  }, [])

  const setSayAnswer = useCallback((value) => {
    const nextValue = Boolean(value)
    sayAnswerRef.current = nextValue
    setSayAnswerState(nextValue)
  }, [])

  const start = useCallback(() => {
    if (isRunningRef.current) return false

    clearPendingWork()
    sessionRef.current += 1
    roundRef.current = 0
    isRunningRef.current = true
    setIsRunning(true)
    return true
  }, [clearPendingWork])

  const stop = useCallback(() => {
    const wasRunning = isRunningRef.current
    isRunningRef.current = false
    sessionRef.current += 1
    roundRef.current += 1
    clearPendingWork()
    setIsRunning(false)
    return wasRunning
  }, [clearPendingWork])

  const scheduleNextRound = useCallback((onComplete, roundStartedAt, sessionId, roundId) => {
    const waitForSelectedInterval = () => {
      const remaining = intervalRef.current - (now() - roundStartedAt)
      if (remaining > 0) {
        schedule(waitForSelectedInterval, remaining, sessionId, roundId)
        return
      }
      onComplete?.()
    }

    schedule(waitForSelectedInterval, RESOLUTION_DURATION_MS, sessionId, roundId)
  }, [schedule])

  const playResolution = useCallback((
    targetMidi,
    tonicMidi,
    playTone,
    getCurrentTime,
    onComplete,
    roundStartedAt,
    sessionId,
    roundId
  ) => {
    schedule(() => {
      const currentTime = getCurrentTime()
      if (currentTime === null) {
        scheduleNextRound(onComplete, roundStartedAt, sessionId, roundId)
        return
      }

      const t0 = currentTime + 0.1
      playTone(targetMidi, t0, 0.45, 'piano', 0.16)
      playTone(tonicMidi, t0 + 0.46, 0.8, 'piano', 0.18)

      scheduleNextRound(onComplete, roundStartedAt, sessionId, roundId)
    }, RESOLUTION_DELAY_MS, sessionId, roundId)
  }, [schedule, scheduleNextRound])

  const showAutoAnswer = useCallback((
    targetMidi,
    tonicMidi,
    playTone,
    getCurrentTime,
    onComplete,
    roundStartedAt = now(),
    sessionId = sessionRef.current,
    roundId = roundRef.current
  ) => {
    if (!isCurrentRound(sessionId, roundId)) return undefined

    const targetLabel = labelForMidi(targetMidi, notationRef.current, tonicMidi % 12)
    const result = {
      message: showAnswerRef.current
        ? `✨ Answer: ${targetLabel}`
        : '🎵 (Answer hidden)',
      shouldHighlight: showAnswerRef.current,
      targetMidi
    }

    const continueWithResolution = () => {
      if (!isCurrentRound(sessionId, roundId)) return
      playResolution(
        targetMidi,
        tonicMidi,
        playTone,
        getCurrentTime,
        onComplete,
        roundStartedAt,
        sessionId,
        roundId
      )
    }

    const synthesis = globalThis.speechSynthesis
    const Utterance = globalThis.SpeechSynthesisUtterance
    if (!sayAnswerRef.current || !synthesis || !Utterance) {
      continueWithResolution()
      return result
    }

    cancelSpeech()
    const utterance = new Utterance(targetLabel)
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utteranceRef.current = utterance

    let settled = false
    let watchdogTimer = null
    const finishSpeech = () => {
      if (settled) return
      settled = true
      clearTimer(watchdogTimer)

      if (utteranceRef.current === utterance) {
        utteranceRef.current = null
      }
      utterance.onend = null
      utterance.onerror = null
      continueWithResolution()
    }

    utterance.onend = finishSpeech
    utterance.onerror = finishSpeech
    watchdogTimer = schedule(finishSpeech, SPEECH_WATCHDOG_MS, sessionId, roundId)

    try {
      synthesis.speak(utterance)
    } catch (error) {
      console.warn('Could not speak the auto-mode answer:', error)
      finishSpeech()
    }

    return result
  }, [cancelSpeech, clearTimer, isCurrentRound, playResolution, schedule])

  const runAutoRound = useCallback((
    targetMidi,
    tonicMidi,
    playCadence,
    playTone,
    getCurrentTime,
    onComplete,
    onUIUpdate
  ) => {
    if (!isRunningRef.current) return false

    const currentTime = getCurrentTime()
    if (currentTime === null) return false

    // A round owns every pending timer and utterance. Starting another round
    // invalidates the previous owner so accidental duplicate calls cannot loop.
    clearPendingWork()
    const sessionId = sessionRef.current
    const roundId = roundRef.current + 1
    roundRef.current = roundId
    const roundStartedAt = now()

    const endCadence = playCadence(tonicMidi)
    const targetTime = endCadence + 0.12
    playTone(targetMidi, targetTime, 0.9, 'piano', 0.18)

    const beginAnswerSequence = (audioDelayMs) => {
      schedule(() => {
        onUIUpdate?.('🎧 Listen...', false, targetMidi)

        schedule(() => {
          const result = showAutoAnswer(
            targetMidi,
            tonicMidi,
            playTone,
            getCurrentTime,
            onComplete,
            roundStartedAt,
            sessionId,
            roundId
          )
          if (result) {
            onUIUpdate?.(result.message, result.shouldHighlight, result.targetMidi)
          }
        }, ANSWER_DELAY_MS, sessionId, roundId)
      }, audioDelayMs, sessionId, roundId)
    }

    const audioDelayMs = Math.max(0, (targetTime - currentTime) * 1000) + 200
    beginAnswerSequence(audioDelayMs)

    return true
  }, [clearPendingWork, schedule, showAutoAnswer])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      isRunningRef.current = false
      sessionRef.current += 1
      roundRef.current += 1
      clearPendingWork()
    }
  }, [clearPendingWork])

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
