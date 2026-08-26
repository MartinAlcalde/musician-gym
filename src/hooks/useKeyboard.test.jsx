import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useKeyboard } from './useKeyboard.js'
import { NOTES, STORAGE_KEYS } from '../utils/constants.js'

describe('useKeyboard', () => {
  beforeEach(() => localStorage.clear())

  it('uses the default home-row mappings', () => {
    const { result } = renderHook(() => useKeyboard())
    expect(result.current.getMidiForEvent({ key: 'a', code: 'KeyA' })).toBe(NOTES.C4)
    expect(result.current.getKeyForMidi(NOTES.C4)).toBe('a')
  })

  it('maps a keyboard event and persists it', () => {
    const { result } = renderHook(() => useKeyboard())
    const onMidiTriggered = vi.fn()

    act(() => result.current.startMapping(NOTES.C4))
    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ' }),
        onMidiTriggered
      )
    })

    expect(result.current.getMidiForEvent({ key: 'q', code: 'KeyQ' })).toBe(NOTES.C4)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.KEYMAP))['code:keyq']).toBe(NOTES.C4)
  })

  it('maps and resolves stable external input identifiers', () => {
    const { result } = renderHook(() => useKeyboard())
    const inputId = 'gamepad:controller:button:0'

    act(() => result.current.setExternalInputMapping(NOTES.G4, inputId))

    expect(result.current.getMidiForExternalInput(inputId)).toBe(NOTES.G4)
    expect(result.current.getKeyForMidi(NOTES.G4)).toBe('🎮 button 0')

    act(() => result.current.setExternalInputMapping(NOTES.A4, 'gamepad:controller:axis:1:neg'))
    expect(result.current.getKeyForMidi(NOTES.A4)).toBe('🕹️ axis 1 neg')
  })
})
