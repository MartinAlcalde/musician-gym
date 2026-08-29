import { useCallback, useEffect, useRef } from 'react'

const ANNOUNCEMENT_WATCHDOG_MS = 7000

export function useSpeechAnnouncement() {
  const activeRef = useRef(null)

  const cancel = useCallback(() => {
    activeRef.current?.finish(false)
    globalThis.speechSynthesis?.cancel()
  }, [])

  const announce = useCallback((message, language = 'en-US') => {
    const synthesis = globalThis.speechSynthesis
    const Utterance = globalThis.SpeechSynthesisUtterance
    if (!message || !synthesis || !Utterance) return Promise.resolve(false)

    cancel()
    return new Promise(resolve => {
      const utterance = new Utterance(message)
      let settled = false
      const finish = spoken => {
        if (settled) return
        settled = true
        globalThis.clearTimeout(watchdog)
        utterance.onend = null
        utterance.onerror = null
        if (activeRef.current?.utterance === utterance) activeRef.current = null
        resolve(spoken)
      }
      const watchdog = globalThis.setTimeout(() => finish(false), ANNOUNCEMENT_WATCHDOG_MS)

      utterance.lang = language
      utterance.rate = 0.88
      utterance.pitch = 1
      utterance.onend = () => finish(true)
      utterance.onerror = () => finish(false)
      activeRef.current = { utterance, finish }

      try {
        synthesis.resume?.()
        synthesis.speak(utterance)
      } catch (error) {
        console.warn('Could not announce the vocal exercise:', error)
        finish(false)
      }
    })
  }, [cancel])

  useEffect(() => cancel, [cancel])

  return { announce, cancel }
}
