import { useState, useRef, useEffect, useCallback } from 'react'
import { idsFromEvent, isReservedKeyId, saveToStorage, loadFromStorage } from '../utils/helpers.js'
import { STORAGE_KEYS, NOTES } from '../utils/constants.js'

export function useKeyboard() {
  const [waitingMapMidi, setWaitingMapMidi] = useState(null)
  const waitingMapMidiRef = useRef(null)
  const keymapRef = useRef({})

  // Keep ref in sync with state
  useEffect(() => {
    waitingMapMidiRef.current = waitingMapMidi
  }, [waitingMapMidi])

  // Load keymap from localStorage on mount
  useEffect(() => {
    const savedKeymap = loadFromStorage(STORAGE_KEYS.KEYMAP)
    if (savedKeymap) {
      keymapRef.current = savedKeymap
    } else {
      // Default home-row mapping
      keymapRef.current = { 
        a: NOTES.C4, 
        s: NOTES.D4, 
        d: NOTES.E4, 
        f: NOTES.F4, 
        g: NOTES.G4, 
        h: NOTES.A4, 
        j: NOTES.B4, 
        k: NOTES.C5 
      }
      saveKeymap()
    }
  }, [])

  const saveKeymap = useCallback(() => {
    saveToStorage(STORAGE_KEYS.KEYMAP, keymapRef.current)
  }, [])

  const setKeymapFromEvent = useCallback((midi, event) => {
    const ids = idsFromEvent(event).filter(id => id && !isReservedKeyId(id))
    if (ids.length === 0) return

    // Remove existing mappings for this midi and these keys
    Object.keys(keymapRef.current).forEach(k => {
      if (keymapRef.current[k] === midi || ids.includes(k)) {
        delete keymapRef.current[k]
      }
    })

    // Add new mapping
    const preferred = ids.find(id => id && id.startsWith('code:')) || 
                     ids.find(id => id && id.startsWith('key:')) || 
                     ids[0]
    if (preferred) {
      keymapRef.current[preferred] = midi
      saveKeymap()
    }
  }, [saveKeymap])

  const setKeymapFromGamepad = useCallback((midi, gamepadId) => {
    // Remove existing mappings for this midi and this gamepad button
    Object.keys(keymapRef.current).forEach(k => {
      if (keymapRef.current[k] === midi || k === gamepadId) {
        delete keymapRef.current[k]
      }
    })

    // Add new mapping
    keymapRef.current[gamepadId] = midi
    saveKeymap()
  }, [saveKeymap])

  const getMidiForGamepadId = useCallback((gamepadId) => {
    return keymapRef.current[gamepadId] || null
  }, [])

  const clearKeymap = useCallback((midi) => {
    Object.keys(keymapRef.current).forEach(k => {
      if (keymapRef.current[k] === midi) {
        delete keymapRef.current[k]
      }
    })
    saveKeymap()
  }, [saveKeymap])

  const getKeyForMidi = useCallback((midi) => {
    const entries = Object.entries(keymapRef.current).filter(([k, m]) => m === midi)
    if (entries.length === 0) return ''
    
    const simple = entries.find(([k]) => k && k.length === 1)
    const gamepad = entries.find(([k]) => k && k.startsWith('gamepad:'))
    const chosen = simple || gamepad || entries[0]
    if (!chosen || !chosen[0]) return ''
    
    const id = chosen[0]
    if (!id || typeof id !== 'string') return ''
    
    if (id.startsWith('key:')) return id.slice(4)
    if (id.startsWith('code:')) return id.slice(5)
    if (id.startsWith('gamepad:')) {
      const parts = id.split(':')
      const control = parts[2]
      if (!control || typeof control !== 'string') return `🎮${parts[1]}:?`
      
      if (control.startsWith('btn')) {
        return `🎮${parts[1]}:${control}`
      } else if (control.startsWith('axis')) {
        return `🕹️${parts[1]}:${control}`
      }
      return `🎮${parts[1]}:${control}`
    }
    return id || ''
  }, [])

  const getMidiForEvent = useCallback((event) => {
    const ids = idsFromEvent(event)
    for (const id of ids) {
      if (keymapRef.current[id] != null) {
        return keymapRef.current[id]
      }
    }
    return null
  }, [])

  const startMapping = useCallback((midi) => {
    setWaitingMapMidi(midi)
    waitingMapMidiRef.current = midi // Update ref immediately
  }, [waitingMapMidi])

  const cancelMapping = useCallback(() => {
    setWaitingMapMidi(null)
    waitingMapMidiRef.current = null
  }, [])

  const handleKeyDown = useCallback((event, onMidiTriggered) => {
    // Handle mapping assignment
    if (waitingMapMidi !== null) {
      event.preventDefault()
      if (event.key === 'Escape') {
        cancelMapping()
        return { type: 'mapping_cancelled' }
      }
      setKeymapFromEvent(waitingMapMidi, event)
      cancelMapping()
      return { type: 'mapping_set', midi: waitingMapMidi }
    }

    // Handle Enter key for start button
    if (event.key === "Enter") {
      return { type: 'start_triggered' }
    }

    // Handle mapped keys
    const midi = getMidiForEvent(event)
    if (midi != null) {
      event.preventDefault()
      onMidiTriggered?.(midi)
      return { type: 'midi_triggered', midi }
    }

    return { type: 'no_action' }
  }, [waitingMapMidi, cancelMapping, setKeymapFromEvent, getMidiForEvent])

  return {
    waitingMapMidi,
    waitingMapMidiRef,
    startMapping,
    cancelMapping,
    setKeymapFromEvent,
    setKeymapFromGamepad,
    getMidiForGamepadId,
    clearKeymap,
    getKeyForMidi,
    getMidiForEvent,
    handleKeyDown,
    keymap: keymapRef.current
  }
}