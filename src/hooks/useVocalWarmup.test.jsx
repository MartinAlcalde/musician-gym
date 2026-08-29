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

  it('rests for two extra seconds before starting the next key', async () => {
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

    await act(() => vi.advanceTimersByTimeAsync(2999))
    expect(playTone).toHaveBeenCalledTimes(7)

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(playTone).toHaveBeenCalledTimes(8)
    expect(playTone.mock.calls[7][0]).toBe(61)
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
})
