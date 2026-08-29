import { useCallback, useRef, useState } from 'react'
import { useManagedTimeouts } from './useManagedTimeouts.js'
import { buildVocalWarmupSequence } from '../utils/vocalWarmups.js'

const KEY_CHANGE_REST_BEATS = 1

export function useVocalWarmup({ playTone, getCurrentTime, startAudioContext }) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [step, setStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [completed, setCompleted] = useState(false)
  const { schedule, clearAll } = useManagedTimeouts()
  const sessionRef = useRef(0)
  const seekRef = useRef(null)

  const stop = useCallback(() => {
    sessionRef.current += 1
    seekRef.current = null
    clearAll()
    setIsRunning(false)
    setCurrentEvent(null)
    setStep(0)
    setTotalSteps(0)
    setCompleted(false)
  }, [clearAll])

  const start = useCallback(async ({ tempo = 72, onComplete, ...sequenceOptions } = {}) => {
    stop()
    const audioStarted = await startAudioContext()
    if (!audioStarted) return false

    const sequence = buildVocalWarmupSequence(sequenceOptions)
    const beatMs = 60000 / Math.max(40, Math.min(160, Number(tempo) || 72))
    const sessionId = sessionRef.current
    let sequenceIndex = 0

    setIsRunning(true)
    setCompleted(false)
    setTotalSteps(sequence.length)

    const playNext = () => {
      if (sessionRef.current !== sessionId) return
      if (sequenceIndex >= sequence.length) {
        setIsRunning(false)
        setCompleted(true)
        onComplete?.()
        return
      }

      const event = sequence[sequenceIndex]
      const currentTime = getCurrentTime()
      playTone(event.midi, (currentTime ?? 0) + 0.025, beatMs / 1000 * 0.82, 'piano', 0.16)
      setCurrentEvent(event)
      setStep(sequenceIndex + 1)
      sequenceIndex += 1
      const nextEvent = sequence[sequenceIndex]
      const changesPhrase = nextEvent && (
        nextEvent.cycleTonicMidi !== event.cycleTonicMidi ||
        nextEvent.segmentId !== event.segmentId
      )
      schedule(playNext, beatMs * (changesPhrase ? 1 + KEY_CHANGE_REST_BEATS : 1))
    }

    seekRef.current = targetIndex => {
      if (sessionRef.current !== sessionId || sequence.length === 0) return false

      clearAll()
      sequenceIndex = Math.max(0, Math.min(sequence.length - 1, Math.round(Number(targetIndex) || 0)))
      setIsRunning(true)
      setCompleted(false)
      playNext()
      return true
    }

    playNext()
    return true
  }, [clearAll, getCurrentTime, playTone, schedule, startAudioContext, stop])

  const seek = useCallback(targetIndex => seekRef.current?.(targetIndex) ?? false, [])

  return {
    isRunning,
    currentEvent,
    step,
    totalSteps,
    completed,
    progress: totalSteps ? Math.round((step / totalSteps) * 100) : 0,
    start,
    stop,
    seek
  }
}
