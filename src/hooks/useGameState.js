import { useState, useMemo, useCallback } from 'react'
import {
  getExerciseSet,
  pickRandomTargetMidi,
  labelForMidi,
  loadFromStorage,
  saveToStorage
} from '../utils/helpers.js'
import { STORAGE_KEYS } from '../utils/constants.js'

const loadStats = () => {
  const saved = loadFromStorage(STORAGE_KEYS.STATS, { attempts: 0, correct: 0 })
  const attempts = Number.isFinite(saved?.attempts) ? Math.max(0, saved.attempts) : 0
  const correct = Number.isFinite(saved?.correct)
    ? Math.min(attempts, Math.max(0, saved.correct))
    : 0

  return { attempts, correct }
}

export function useGameState({ tonicMidi = 60, scaleType = 'major' } = {}) {
  const [stats, setStats] = useState(loadStats)
  const [targetMidi, setTargetMidi] = useState(null)
  const [exercise, setExercise] = useState(1)
  const [answersEnabled, setAnswersEnabled] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)

  const { attempts, correct } = stats

  const accuracy = useMemo(() =>
    attempts ? Math.round((100 * correct) / attempts) : 0
  , [attempts, correct])

  const exerciseSet = useMemo(() => 
    getExerciseSet(exercise, tonicMidi, scaleType)
  , [exercise, tonicMidi, scaleType])

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
    setStats(previousStats => {
      const nextStats = {
        attempts: previousStats.attempts + 1,
        correct: previousStats.correct + (isCorrect ? 1 : 0)
      }
      saveToStorage(STORAGE_KEYS.STATS, nextStats)
      return nextStats
    })
    
    return {
      isValid: true,
      isCorrect,
      message: isCorrect
        ? '✓ Correct'
        : `✗ Wrong (it was ${labelForMidi(targetMidi, notation, tonicMidi % 12, scaleType)})`
    }
  }, [targetMidi, answersEnabled, exerciseSet, tonicMidi, scaleType])

  const startNewRound = useCallback(() => {
    const newTarget = pickRandomTargetMidi(exercise, tonicMidi, scaleType)
    setTargetMidi(newTarget)
    setAnswersEnabled(false)
    setRepeatEnabled(false)
    return newTarget
  }, [exercise, tonicMidi, scaleType])

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

  const resetStats = useCallback(() => {
    const emptyStats = { attempts: 0, correct: 0 }
    setStats(emptyStats)
    saveToStorage(STORAGE_KEYS.STATS, emptyStats)
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
    resetTarget,
    resetStats
  }
}
