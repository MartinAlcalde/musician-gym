import { useCallback, useRef, useState } from 'react'
import { useManagedTimeouts } from './useManagedTimeouts.js'
import { buildVocalWarmupSequence } from '../utils/vocalWarmups.js'

const KEY_CHANGE_REST_MS = 2000

export function useVocalWarmup({ playTone, getCurrentTime, startAudioContext }) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [step, setStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [completed, setCompleted] = useState(false)
  const { schedule, clearAll } = useManagedTimeouts()
  const sessionRef = useRef(0)

  const stop = useCallback(() => {
    sessionRef.current += 1
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
      const changesKey = nextEvent && nextEvent.cycleIndex !== event.cycleIndex
      schedule(playNext, beatMs + (changesKey ? KEY_CHANGE_REST_MS : 0))
    }

    playNext()
    return true
  }, [getCurrentTime, playTone, schedule, startAudioContext, stop])

  return {
    isRunning,
    currentEvent,
    step,
    totalSteps,
    completed,
    progress: totalSteps ? Math.round((step / totalSteps) * 100) : 0,
    start,
    stop
  }
}
