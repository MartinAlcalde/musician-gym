import { useState, useMemo, useCallback } from 'react'
import { getExerciseSet, pickRandomTargetMidi, labelForMidi } from '../utils/helpers.js'

export function useGameState() {
  const [attempts, setAttempts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [targetMidi, setTargetMidi] = useState(null)
  const [exercise, setExercise] = useState(1)
  const [answersEnabled, setAnswersEnabled] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)

  const accuracy = useMemo(() => 
    attempts ? Math.round((100 * correct) / attempts) : 0
  , [attempts, correct])

  const exerciseSet = useMemo(() => 
    getExerciseSet(exercise)
  , [exercise])

  const submitAnswer = useCallback((midi, notation = 'letter') => {
    if (!targetMidi || !answersEnabled) return null
    
    const allowed = new Set(exerciseSet)
    if (!allowed.has(midi)) {
      return { 
        isValid: false, 
        message: 'Only notes in the highlighted range' 
      }
    }
    
    const isCorrect = midi === targetMidi
    setAttempts(prev => prev + 1)
    if (isCorrect) setCorrect(prev => prev + 1)
    
    return {
      isValid: true,
      isCorrect,
      message: isCorrect ? '✓ Correct' : `✗ Wrong (it was ${labelForMidi(targetMidi, notation)})`
    }
  }, [targetMidi, answersEnabled, exerciseSet])

  const startNewRound = useCallback(() => {
    const newTarget = pickRandomTargetMidi(exercise)
    setTargetMidi(newTarget)
    setAnswersEnabled(false)
    setRepeatEnabled(false)
    return newTarget
  }, [exercise])

  const enableAnswers = useCallback(() => {
    setAnswersEnabled(true)
    setRepeatEnabled(true)
  }, [])

  const disableAnswers = useCallback(() => {
    setAnswersEnabled(false)
    setRepeatEnabled(false)
  }, [])

  const resetTarget = useCallback(() => {
    setTargetMidi(null)
  }, [])

  return {
    // State
    attempts,
    correct,
    accuracy,
    targetMidi,
    exercise,
    exerciseSet,
    answersEnabled,
    repeatEnabled,
    
    // Actions
    setExercise,
    submitAnswer,
    startNewRound,
    enableAnswers,
    disableAnswers,
    resetTarget
  }
}