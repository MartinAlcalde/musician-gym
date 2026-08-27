import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNotchedAudio } from './useNotchedAudio.js'

const audioParam = () => ({
  setTargetAtTime: vi.fn(),
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn()
})

const audioNode = extra => ({
  connect: vi.fn(destination => destination),
  disconnect: vi.fn(),
  ...extra
})

describe('useNotchedAudio', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('routes local music through a real-time notch and a safe master gain', async () => {
    const listeners = new Map()
    const audioElement = {
      currentTime: 0,
      duration: 180,
      src: '',
      preload: '',
      addEventListener: vi.fn((name, callback) => listeners.set(name, callback)),
      removeEventListener: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(async () => listeners.get('play')?.()),
      removeAttribute: vi.fn(),
      load: vi.fn()
    }
    class AudioMock {
      constructor() {
        return audioElement
      }
    }

    const source = audioNode()
    const notch = audioNode({ frequency: audioParam(), Q: audioParam(), type: '' })
    const wetGain = audioNode({ gain: audioParam() })
    const dryGain = audioNode({ gain: audioParam() })
    const masterGain = audioNode({ gain: audioParam() })
    const context = {
      state: 'suspended',
      currentTime: 1,
      sampleRate: 48000,
      destination: {},
      resume: vi.fn(async () => { context.state = 'running' }),
      close: vi.fn(),
      createMediaElementSource: vi.fn(() => source),
      createBiquadFilter: vi.fn(() => notch),
      createGain: vi.fn()
        .mockReturnValueOnce(wetGain)
        .mockReturnValueOnce(dryGain)
        .mockReturnValueOnce(masterGain)
    }
    class AudioContextMock {
      constructor() {
        return context
      }
    }

    vi.stubGlobal('Audio', AudioMock)
    vi.stubGlobal('AudioContext', AudioContextMock)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test-song'),
      revokeObjectURL: vi.fn()
    })

    const { result, unmount } = renderHook(() => useNotchedAudio({
      frequency: 6000,
      widthInOctaves: 1,
      filterEnabled: true,
      volume: 0.35
    }))

    act(() => result.current.loadFile({ name: 'song.mp3', type: 'audio/mpeg' }))
    await act(async () => {
      expect(await result.current.play()).toBe(true)
    })

    expect(notch.type).toBe('notch')
    expect(notch.frequency.setTargetAtTime).toHaveBeenCalledWith(6000, 1, 0.015)
    expect(notch.Q.setTargetAtTime.mock.calls.at(-1)[0]).toBeCloseTo(Math.SQRT2)
    expect(wetGain.gain.setTargetAtTime).toHaveBeenCalledWith(1, 1, 0.015)
    expect(dryGain.gain.setTargetAtTime).toHaveBeenCalledWith(0, 1, 0.015)
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.35, 1, 0.015)
    expect(audioElement.play).toHaveBeenCalledTimes(1)

    unmount()
    expect(context.close).toHaveBeenCalledTimes(1)
  })
})
