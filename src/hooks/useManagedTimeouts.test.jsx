import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useManagedTimeouts } from './useManagedTimeouts.js'

describe('useManagedTimeouts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('runs scheduled callbacks once', async () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useManagedTimeouts())

    act(() => result.current.schedule(callback, 100))
    await act(() => vi.advanceTimersByTimeAsync(100))

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancels pending callbacks on demand and unmount', async () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useManagedTimeouts())

    act(() => {
      result.current.schedule(callback, 100)
      result.current.clearAll()
      result.current.schedule(callback, 200)
    })
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(callback).not.toHaveBeenCalled()
  })
})
