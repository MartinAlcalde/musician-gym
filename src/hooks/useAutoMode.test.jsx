import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoMode } from './useAutoMode.js'

describe('useAutoMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(globalThis, 'speechSynthesis', {
      configurable: true,
      value: { speak: vi.fn(), cancel: vi.fn() }
    })
  })

  afterEach(() => vi.useRealTimers())

  const startRound = result => {
    const playCadence = vi.fn(() => 0.1)
    const playTone = vi.fn()
    const getCurrentTime = vi.fn(() => 0)
    const onComplete = vi.fn()
    const onUIUpdate = vi.fn()

    act(() => {
      result.current.start()
      result.current.runAutoRound(
        60,
        60,
        'major',
        playCadence,
        playTone,
        getCurrentTime,
        onComplete,
        onUIUpdate
      )
    })

    return { playCadence, playTone, onComplete, onUIUpdate }
  }

  it('runs one complete round and schedules the next exactly once', async () => {
    const { result } = renderHook(() => useAutoMode({
      initialInterval: 3000,
      initialSayAnswer: false
    }))
    const callbacks = startRound(result)

    await act(() => vi.advanceTimersByTimeAsync(2500))
    expect(callbacks.onUIUpdate).toHaveBeenCalledWith('✨ Answer: do', true, 60)

    await act(() => vi.advanceTimersByTimeAsync(2500))
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1)
    expect(callbacks.playTone).toHaveBeenCalledTimes(3)
  })

  it('cancels every pending callback when stopped', async () => {
    const { result } = renderHook(() => useAutoMode({ initialSayAnswer: false }))
    const callbacks = startRound(result)

    act(() => result.current.stop())
    await act(() => vi.advanceTimersByTimeAsync(30000))

    expect(callbacks.onUIUpdate).not.toHaveBeenCalled()
    expect(callbacks.onComplete).not.toHaveBeenCalled()
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled()
  })

  it('invalidates an old round when a replacement starts', async () => {
    const { result } = renderHook(() => useAutoMode({ initialSayAnswer: false }))
    const first = startRound(result)
    const secondComplete = vi.fn()

    act(() => {
      result.current.runAutoRound(
        62,
        60,
        'major',
        () => 0.1,
        vi.fn(),
        () => 0,
        secondComplete,
        vi.fn()
      )
    })
    await act(() => vi.advanceTimersByTimeAsync(30000))

    expect(first.onComplete).not.toHaveBeenCalled()
    expect(secondComplete).toHaveBeenCalledTimes(1)
  })

  it('announces relative solfege and resolves to the selected tonic', async () => {
    const { result } = renderHook(() => useAutoMode({
      initialInterval: 3000,
      initialSayAnswer: false
    }))
    const playTone = vi.fn()
    const onUIUpdate = vi.fn()

    act(() => {
      result.current.start()
      result.current.runAutoRound(
        66,
        62,
        'major',
        () => 0.1,
        playTone,
        () => 0,
        vi.fn(),
        onUIUpdate
      )
    })

    await act(() => vi.advanceTimersByTimeAsync(2500))
    expect(onUIUpdate).toHaveBeenCalledWith('✨ Answer: mi', true, 66)

    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(playTone.mock.calls.some(call => call[0] === 62)).toBe(true)
  })

  it('announces altered degrees in natural minor', async () => {
    const { result } = renderHook(() => useAutoMode({
      initialInterval: 3000,
      initialSayAnswer: false
    }))
    const onUIUpdate = vi.fn()

    act(() => {
      result.current.start()
      result.current.runAutoRound(
        72,
        69,
        'naturalMinor',
        () => 0.1,
        vi.fn(),
        () => 0,
        vi.fn(),
        onUIUpdate
      )
    })

    await act(() => vi.advanceTimersByTimeAsync(2500))
    expect(onUIUpdate).toHaveBeenCalledWith('✨ Answer: mi♭', true, 72)
  })
})
