import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useScreenWakeLock } from './useScreenWakeLock.js'

const createSentinel = () => {
  const sentinel = new EventTarget()
  sentinel.released = false
  sentinel.release = vi.fn(async () => {
    sentinel.released = true
    sentinel.dispatchEvent(new Event('release'))
  })
  return sentinel
}

describe('useScreenWakeLock', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })
  })

  it('acquires and releases a screen wake lock', async () => {
    const sentinel = createSentinel()
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: vi.fn(async () => sentinel) }
    })
    const { result } = renderHook(() => useScreenWakeLock())

    await act(() => result.current.request())
    expect(result.current.isActive).toBe(true)

    await act(() => result.current.release())
    expect(sentinel.release).toHaveBeenCalledTimes(1)
    expect(result.current.isActive).toBe(false)
  })

  it('releases a late request if auto mode was stopped while waiting', async () => {
    const sentinel = createSentinel()
    let resolveRequest
    const pendingRequest = new Promise(resolve => {
      resolveRequest = resolve
    })
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: vi.fn(() => pendingRequest) }
    })
    const { result } = renderHook(() => useScreenWakeLock())

    let requestPromise
    act(() => {
      requestPromise = result.current.request()
    })
    await act(() => result.current.release())
    await act(async () => {
      resolveRequest(sentinel)
      await requestPromise
    })

    expect(sentinel.release).toHaveBeenCalledTimes(1)
    expect(result.current.isActive).toBe(false)
  })
})
