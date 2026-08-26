import { useState, useRef, useCallback } from 'react'
import { idsFromEvent, isReservedKeyId, saveToStorage, loadFromStorage } from '../utils/helpers.js'
import { STORAGE_KEYS, NOTES } from '../utils/constants.js'

const DEFAULT_KEYMAP = {
  a: NOTES.C4,
  s: NOTES.D4,
  d: NOTES.E4,
  f: NOTES.F4,
  g: NOTES.G4,
  h: NOTES.A4,
  j: NOTES.B4,
  k: NOTES.C5
}

const loadKeymap = () => {
  const saved = loadFromStorage(STORAGE_KEYS.KEYMAP)
  return saved && typeof saved === 'object' ? saved : DEFAULT_KEYMAP
}

export function useKeyboard() {
  const [waitingMapMidi, setWaitingMapMidi] = useState(null)
  const [keymap, setKeymap] = useState(loadKeymap)
  const waitingMapMidiRef = useRef(null)
  const keymapRef = useRef(keymap)

  const commitKeymap = useCallback(nextKeymap => {
    keymapRef.current = nextKeymap
    setKeymap(nextKeymap)
    saveToStorage(STORAGE_KEYS.KEYMAP, nextKeymap)
  }, [])

  const setKeymapFromEvent = useCallback((midi, event) => {
    const ids = idsFromEvent(event).filter(id => id && !isReservedKeyId(id))
    if (!ids.length) return false

    const nextKeymap = { ...keymapRef.current }
    Object.keys(nextKeymap).forEach(key => {
      if (nextKeymap[key] === midi || ids.includes(key)) delete nextKeymap[key]
    })

    const preferred = ids.find(id => id.startsWith('code:')) ||
      ids.find(id => id.startsWith('key:')) ||
      ids[0]

    nextKeymap[preferred] = midi
    commitKeymap(nextKeymap)
    return true
  }, [commitKeymap])

  const setExternalInputMapping = useCallback((midi, inputId) => {
    if (!inputId || typeof inputId !== 'string') return false

    const nextKeymap = { ...keymapRef.current }
    Object.keys(nextKeymap).forEach(key => {
      if (nextKeymap[key] === midi || key === inputId) delete nextKeymap[key]
    })

    nextKeymap[inputId] = midi
    commitKeymap(nextKeymap)
    return true
  }, [commitKeymap])

  const getMidiForExternalInput = useCallback(inputId => {
    return keymapRef.current[inputId] ?? null
  }, [])

  const clearKeymap = useCallback(midi => {
    const nextKeymap = Object.fromEntries(
      Object.entries(keymapRef.current).filter(([, mappedMidi]) => mappedMidi !== midi)
    )
    commitKeymap(nextKeymap)
  }, [commitKeymap])

  const getKeyForMidi = useCallback(midi => {
    const entries = Object.entries(keymap).filter(([, mappedMidi]) => mappedMidi === midi)
    if (!entries.length) return ''

    const simple = entries.find(([key]) => key.length === 1)
    const externalInput = entries.find(([key]) => /^(gamepad|hid|bluetooth):/.test(key))
    const id = (simple || externalInput || entries[0])[0]

    if (id.startsWith('key:')) return id.slice(4)
    if (id.startsWith('code:')) return id.slice(5)
    if (id.startsWith('gamepad:')) {
      const parts = id.split(':')
      const controlType = parts.at(-2)
      const control = parts.at(-1)
      if (parts.at(-3) === 'axis') {
        return `🕹️ axis ${parts.at(-2)} ${control}`
      }
      return controlType === 'axis' ? `🕹️ axis ${control}` : `🎮 button ${control}`
    }
    if (id.startsWith('hid:')) return '🎛️ HID'
    if (id.startsWith('bluetooth:')) return '🔵 Bluetooth'
    return id
  }, [keymap])

  const getMidiForEvent = useCallback(event => {
    for (const id of idsFromEvent(event)) {
      if (keymapRef.current[id] != null) return keymapRef.current[id]
    }
    return null
  }, [])

  const startMapping = useCallback(midi => {
    waitingMapMidiRef.current = midi
    setWaitingMapMidi(midi)
  }, [])

  const cancelMapping = useCallback(() => {
    waitingMapMidiRef.current = null
    setWaitingMapMidi(null)
  }, [])

  const handleKeyDown = useCallback((event, onMidiTriggered) => {
    const mappingMidi = waitingMapMidiRef.current
    if (mappingMidi !== null) {
      event.preventDefault()
      if (event.key === 'Escape') {
        cancelMapping()
        return { type: 'mapping_cancelled' }
      }

      const wasMapped = setKeymapFromEvent(mappingMidi, event)
      cancelMapping()
      return wasMapped
        ? { type: 'mapping_set', midi: mappingMidi }
        : { type: 'no_action' }
    }

    const target = event.target
    const isInteractiveTarget = target instanceof Element && Boolean(
      target.closest('button, input, select, textarea, [contenteditable="true"]')
    )
    if (isInteractiveTarget) return { type: 'no_action' }

    if (event.key === 'Enter') return { type: 'start_triggered' }

    const midi = getMidiForEvent(event)
    if (midi !== null) {
      event.preventDefault()
      onMidiTriggered?.(midi)
      return { type: 'midi_triggered', midi }
    }

    return { type: 'no_action' }
  }, [cancelMapping, getMidiForEvent, setKeymapFromEvent])

  return {
    waitingMapMidi,
    waitingMapMidiRef,
    keymap,
    startMapping,
    cancelMapping,
    setKeymapFromEvent,
    setExternalInputMapping,
    getMidiForExternalInput,
    clearKeymap,
    getKeyForMidi,
    getMidiForEvent,
    handleKeyDown
  }
}
