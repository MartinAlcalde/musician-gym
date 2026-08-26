import { useCallback, useEffect, useRef } from 'react'

export function useManagedTimeouts() {
  const timersRef = useRef(new Set())

  const schedule = useCallback((callback, delay) => {
    const timerId = globalThis.setTimeout(() => {
      timersRef.current.delete(timerId)
      callback()
    }, Math.max(0, delay))

    timersRef.current.add(timerId)
    return timerId
  }, [])

  const clearAll = useCallback(() => {
    for (const timerId of timersRef.current) {
      globalThis.clearTimeout(timerId)
    }
    timersRef.current.clear()
  }, [])

  useEffect(() => clearAll, [clearAll])

  return { schedule, clearAll }
}
