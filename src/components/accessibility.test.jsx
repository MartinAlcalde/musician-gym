import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExerciseSelector } from './ExerciseSelector.jsx'
import { GameControls } from './GameControls.jsx'
import { GameDisplay } from './GameDisplay.jsx'
import { Piano } from './Piano.jsx'
import { RemoteControl } from './RemoteControl.jsx'

describe('accessible game controls', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('announces feedback and exposes piano keys as buttons', () => {
    const onKeyClick = vi.fn()
    render(
      <>
        <Piano
          exerciseSet={[60, 62, 64, 65]}
          notation="solfege"
          disabled={false}
          onKeyClick={onKeyClick}
        />
        <GameDisplay feedback="Correct" feedbackOk attempts={1} correct={1} accuracy={100} />
      </>
    )

    const cKey = screen.getByRole('button', { name: /do, C4, in current exercise/i })
    fireEvent.click(cKey)

    expect(onKeyClick).toHaveBeenCalledWith(60, cKey)
    expect(screen.getByRole('status').textContent).toContain('Correct')
  })

  it('closes the exercise dialog with Escape', () => {
    const onClose = vi.fn()
    render(
      <ExerciseSelector
        isVisible
        currentExercise={1}
        onExerciseSelect={vi.fn()}
        onClose={onClose}
      />
    )

    expect(screen.getByRole('dialog', { name: /select exercise/i })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('exposes transposed scale degrees and training-range selectors', () => {
    const onTonicChange = vi.fn()
    const onRegisterChange = vi.fn()
    render(
      <>
        <GameControls
          onStart={vi.fn()}
          onRepeat={vi.fn()}
          onToggleSettings={vi.fn()}
          onToggleExerciseSelector={vi.fn()}
          startEnabled
          repeatEnabled={false}
          autoMode={false}
          isAutoRunning={false}
          currentExercise={1}
          tonicPc={2}
          register="middle"
          onTonicChange={onTonicChange}
          onRegisterChange={onRegisterChange}
        />
        <Piano
          exerciseSet={[62, 64, 66, 67]}
          tonicMidi={62}
          notation="solfege"
          disabled={false}
          onKeyClick={vi.fn()}
        />
      </>
    )

    expect(screen.getByRole('button', { name: /do, D4, in current exercise/i })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Tonality'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText('Register'), { target: { value: 'high' } })
    expect(onTonicChange).toHaveBeenCalledWith(7)
    expect(onRegisterChange).toHaveBeenCalledWith('high')
  })

  it('emits one stable gamepad event per press edge and stops polling on unmount', () => {
    const callbacks = new Map()
    let nextFrameId = 1
    vi.stubGlobal('requestAnimationFrame', vi.fn(callback => {
      const id = nextFrameId
      nextFrameId += 1
      callbacks.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(id => callbacks.delete(id)))

    const gamepad = {
      id: 'Test Controller',
      index: 0,
      buttons: [{ pressed: true, value: 1 }],
      axes: []
    }
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: vi.fn(() => [gamepad])
    })

    const onKeyTest = vi.fn()
    const { unmount } = render(<RemoteControl onKeyTest={onKeyTest} />)
    fireEvent.click(screen.getByRole('button', { name: /detect gamepad/i }))

    act(() => callbacks.get(1)?.())
    expect(onKeyTest).toHaveBeenCalledTimes(1)
    expect(onKeyTest.mock.calls[0][0].inputId).toBe('gamepad:Test%20Controller:button:0')

    act(() => callbacks.get(2)?.())
    expect(onKeyTest).toHaveBeenCalledTimes(1)

    unmount()
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })
})
