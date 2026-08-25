import { useCallback, useEffect, useRef, useState } from 'react'

export function useScreenWakeLock() {
  const wakeLockRef = useRef(null)
  const shouldStayAwakeRef = useRef(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const request = useCallback(async () => {
    shouldStayAwakeRef.current = true
    setError(null)

    if (!isSupported || document.visibilityState !== 'visible') {
      return false
    }

    if (wakeLockRef.current && !wakeLockRef.current.released) {
      return true
    }

    try {
      const wakeLock = await navigator.wakeLock.request('screen')

      if (!shouldStayAwakeRef.current) {
        await wakeLock.release()
        return false
      }

      wakeLockRef.current = wakeLock
      setIsActive(true)

      wakeLock.addEventListener('release', () => {
        if (wakeLockRef.current === wakeLock) {
          wakeLockRef.current = null
          setIsActive(false)
          if (shouldStayAwakeRef.current) {
            setError('The browser released the screen wake lock')
          }
        }
      }, { once: true })

      return true
    } catch (error) {
      console.warn('Could not keep the screen awake:', error)
      setError(error instanceof Error ? error.message : 'Screen wake lock was rejected')
      setIsActive(false)
      return false
    }
  }, [isSupported])

  const release = useCallback(async () => {
    shouldStayAwakeRef.current = false

    const wakeLock = wakeLockRef.current
    wakeLockRef.current = null
    setIsActive(false)

    if (wakeLock && !wakeLock.released) {
      try {
        await wakeLock.release()
      } catch (error) {
        console.warn('Could not release the screen wake lock:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldStayAwakeRef.current) {
        void request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      shouldStayAwakeRef.current = false

      const wakeLock = wakeLockRef.current
      wakeLockRef.current = null
      if (wakeLock && !wakeLock.released) {
        void wakeLock.release()
      }
    }
  }, [request])

  return {
    isSupported,
    isActive,
    error,
    request,
    release
  }
}
