import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVocalWarmup } from './useVocalWarmup.js'

describe('useVocalWarmup', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const setup = () => {
    const playTone = vi.fn()
    const hook = renderHook(() => useVocalWarmup({
      playTone,
      getCurrentTime: () => 0,
      startAudioContext: vi.fn(async () => true)
    }))
    return { ...hook, playTone }
  }

  it('rests for one extra tempo beat before starting the next key', async () => {
    const { result, playTone } = setup()

    await act(async () => result.current.start({
      warmupId: 'arpeggio',
      tonicMidi: 60,
      scaleType: 'major',
      keyCount: 2,
      tempo: 60
    }))

    expect(playTone).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(6000))
    expect(playTone).toHaveBeenCalledTimes(7)

    await act(() => vi.advanceTimersByTimeAsync(1999))
    expect(playTone).toHaveBeenCalledTimes(7)

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(playTone).toHaveBeenCalledTimes(8)
    expect(playTone.mock.calls[7][0]).toBe(61)
  })

  it('uses the original phrase rest between DREKXEL blocks', async () => {
    const { result, playTone } = setup()

    await act(async () => result.current.start({
      warmupId: 'drekxelRoutine',
      tonicMidi: 48,
      keyCount: 1,
      tempo: 60
    }))

    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(playTone).toHaveBeenCalledTimes(5)

    await act(() => vi.advanceTimersByTimeAsync(3999))
    expect(playTone).toHaveBeenCalledTimes(5)

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(playTone).toHaveBeenCalledTimes(6)
    expect(playTone.mock.calls[5][0]).toBe(48)
  })

  it('honors the longer notes in the original lip-bubble pattern', async () => {
    const { result, playTone } = setup()

    await act(async () => result.current.start({
      warmupId: 'drekxelRoutine',
      segmentId: 'bubbles',
      tonicMidi: 48,
      keyCount: 1,
      tempo: 60
    }))

    expect(playTone.mock.calls[0][2]).toBe(1.8)
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(playTone.mock.calls[1][2]).toBe(3.6)
    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(playTone.mock.calls[2][2]).toBe(1.8)
  })

  it('can stop immediately during the rest between keys', async () => {
    const { result, playTone } = setup()

    await act(async () => result.current.start({
      warmupId: 'arpeggio',
      keyCount: 2,
      tempo: 60
    }))
    await act(() => vi.advanceTimersByTimeAsync(6000))
    act(() => result.current.stop())
    await act(() => vi.advanceTimersByTimeAsync(10000))

    expect(playTone).toHaveBeenCalledTimes(7)
    expect(result.current.isRunning).toBe(false)
  })

  it('seeks forward and backward and keeps playing from the selected note', async () => {
    const { result, playTone } = setup()

    await act(async () => result.current.start({
      warmupId: 'fiveTone',
      tonicMidi: 60,
      keyCount: 2,
      tempo: 60
    }))

    act(() => result.current.seek(9))
    expect(playTone).toHaveBeenCalledTimes(2)
    expect(playTone.mock.calls[1][0]).toBe(61)
    expect(result.current.step).toBe(10)

    act(() => result.current.seek(0))
    expect(playTone).toHaveBeenCalledTimes(3)
    expect(playTone.mock.calls[2][0]).toBe(60)
    expect(result.current.step).toBe(1)

    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(playTone.mock.calls[3][0]).toBe(62)
  })
})
