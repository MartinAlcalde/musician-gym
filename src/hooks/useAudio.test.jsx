import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudio } from './useAudio.js'

const audioMocks = vi.hoisted(() => ({
  samplers: [],
  guitarVoices: [],
  guitarOutputs: []
}))

vi.mock('tone', () => {
  class Sampler {
    constructor(options) {
      this.triggerAttackRelease = vi.fn()
      this.dispose = vi.fn()
      audioMocks.samplers.push(this)
      options.onload()
    }

    toDestination() {
      return this
    }
  }

  class PluckSynth {
    constructor(options) {
      this.options = options
      this.volume = { setValueAtTime: vi.fn() }
      this.triggerAttack = vi.fn()
      this.triggerRelease = vi.fn()
      this.dispose = vi.fn()
      audioMocks.guitarVoices.push(this)
    }

    connect(destination) {
      this.destination = destination
      return this
    }
  }

  class EQ3 {
    constructor(options) {
      this.options = options
      this.connect = vi.fn(() => this)
      this.dispose = vi.fn()
      audioMocks.guitarOutputs.push(this)
    }
  }

  class Compressor {
    constructor(options) {
      this.options = options
      this.dispose = vi.fn()
      audioMocks.guitarOutputs.push(this)
    }

    toDestination() {
      return this
    }
  }

  return {
    Sampler,
    PluckSynth,
    EQ3,
    Compressor,
    gainToDb: vi.fn(value => value * 10),
    getContext: () => ({ state: 'running', rawContext: { currentTime: 0 } }),
    now: () => 0,
    start: vi.fn()
  }
})

describe('useAudio', () => {
  beforeEach(() => {
    audioMocks.samplers.length = 0
    audioMocks.guitarVoices.length = 0
    audioMocks.guitarOutputs.length = 0
    window.PIANO_BASE64 = Object.fromEntries(
      ['A2', 'A3', 'A4', 'A5', 'C3', 'C4', 'C5', 'C6'].map(note => [note, `data:${note}`])
    )
  })

  afterEach(() => {
    delete window.PIANO_BASE64
  })

  it('routes piano notes to the sampler and guitar notes to plucked-string voices', async () => {
    const { result, unmount } = renderHook(() => useAudio())
    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => {
      result.current.playTone(60, 1, 0.6, 'piano', 0.15)
      result.current.playTone(64, 2, 0.8, 'guitar', 0.18)
    })

    expect(audioMocks.samplers[0].triggerAttackRelease).toHaveBeenCalledWith(
      'C4', 0.6, 1, expect.closeTo(0.9)
    )
    expect(audioMocks.guitarVoices[0].triggerAttack).toHaveBeenCalledWith('E4', 2)
    expect(audioMocks.guitarVoices[0].triggerRelease).toHaveBeenCalledWith(2.8)
    expect(audioMocks.guitarVoices[0].options).toMatchObject({
      attackNoise: 0.65,
      dampening: 4800,
      resonance: 0.93,
      release: 1.25
    })
    expect(audioMocks.guitarVoices.every(voice => voice.destination === audioMocks.guitarOutputs[0])).toBe(true)

    act(() => result.current.playCadence(60, 'major', 'guitar'))
    const attackTimes = audioMocks.guitarVoices.flatMap(voice => (
      voice.triggerAttack.mock.calls.map(call => call[1])
    ))
    expect(attackTimes).toContain(0.05)
    expect(attackTimes.some(time => Math.abs(time - 0.075) < Number.EPSILON)).toBe(true)

    unmount()
    expect(audioMocks.guitarVoices.every(voice => voice.dispose.mock.calls.length === 1)).toBe(true)
    expect(audioMocks.guitarOutputs.every(node => node.dispose.mock.calls.length === 1)).toBe(true)
  })
})
