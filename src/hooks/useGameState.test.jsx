import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameState } from './useGameState.js'
import { STORAGE_KEYS } from '../utils/constants.js'

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('scores valid answers and persists progress', () => {
    const { result, unmount } = renderHook(() => useGameState())

    let target
    act(() => {
      target = result.current.startNewRound()
      result.current.enableAnswers()
    })

    act(() => {
      expect(result.current.submitAnswer(target, 'solfege')).toMatchObject({
        isValid: true,
        isCorrect: true
      })
    })

    expect(result.current.attempts).toBe(1)
    expect(result.current.correct).toBe(1)
    expect(result.current.accuracy).toBe(100)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS))).toEqual({
      attempts: 1,
      correct: 1
    })

    unmount()
    const restored = renderHook(() => useGameState())
    expect(restored.result.current.attempts).toBe(1)
    expect(restored.result.current.correct).toBe(1)
  })

  it('does not score notes outside the active exercise', () => {
    const { result } = renderHook(() => useGameState())
    act(() => {
      result.current.startNewRound()
      result.current.enableAnswers()
    })

    let answer
    act(() => {
      answer = result.current.submitAnswer(72)
    })

    expect(answer.isValid).toBe(false)
    expect(result.current.attempts).toBe(0)
  })

  it('can reset persisted statistics', () => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({ attempts: 5, correct: 3 }))
    const { result } = renderHook(() => useGameState())

    act(() => result.current.resetStats())

    expect(result.current.attempts).toBe(0)
    expect(result.current.correct).toBe(0)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS))).toEqual({
      attempts: 0,
      correct: 0
    })
  })

  it('uses the selected tonic for targets, validation, and fixed labels', () => {
    const { result } = renderHook(() => useGameState({ tonicMidi: 62 }))

    let target
    act(() => {
      target = result.current.startNewRound()
      result.current.enableAnswers()
    })

    expect(target).toBe(62)
    expect(result.current.exerciseSet).toEqual([62, 64, 66, 67])

    let answer
    act(() => {
      answer = result.current.submitAnswer(64, 'solfege')
    })
    expect(answer.message).toContain('re')
  })

  it('uses natural and harmonic minor exercise notes', () => {
    const natural = renderHook(() => useGameState({
      tonicMidi: 69,
      scaleType: 'naturalMinor'
    }))
    const harmonic = renderHook(() => useGameState({
      tonicMidi: 69,
      scaleType: 'harmonicMinor'
    }))

    expect(natural.result.current.exerciseSet).toEqual([69, 71, 72, 74])
    expect(harmonic.result.current.exerciseSet).toEqual([69, 71, 72, 74])

    act(() => natural.result.current.setExercise(2))
    act(() => harmonic.result.current.setExercise(2))
    expect(natural.result.current.exerciseSet).toEqual([76, 77, 79, 81])
    expect(harmonic.result.current.exerciseSet).toEqual([76, 77, 80, 81])
  })
})
