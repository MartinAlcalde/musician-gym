import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExerciseSelector } from './ExerciseSelector.jsx'
import { GameControls } from './GameControls.jsx'
import { GameDisplay } from './GameDisplay.jsx'
import { Piano } from './Piano.jsx'
import { RemoteControl } from './RemoteControl.jsx'
import { Settings } from './Settings.jsx'
import { TrainingSetup } from './TrainingSetup.jsx'

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
    const onScaleTypeChange = vi.fn()
    const onRegisterChange = vi.fn()
    render(
      <>
        <TrainingSetup
          tonicPc={2}
          scaleType="major"
          register="middle"
          onTonicChange={onTonicChange}
          onScaleTypeChange={onScaleTypeChange}
          onRegisterChange={onRegisterChange}
        />
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
          contextLabel="D Major · Ionian"
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

    expect(screen.getByRole('button', { name: /re, D4, in current exercise/i })).toBeTruthy()
    const scaleSelect = screen.getByLabelText('Scale or mode')
    expect(scaleSelect.querySelectorAll('option')).toHaveLength(8)
    expect(scaleSelect.querySelectorAll('optgroup')).toHaveLength(2)
    expect(screen.getByLabelText('Tonal center').querySelectorAll('option')).toHaveLength(12)
    fireEvent.change(scaleSelect, { target: { value: 'dorian' } })
    fireEvent.change(screen.getByLabelText('Tonal center'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText('Register'), { target: { value: 'high' } })
    expect(onScaleTypeChange).toHaveBeenCalledWith('dorian')
    expect(onTonicChange).toHaveBeenCalledWith(7)
    expect(onRegisterChange).toHaveBeenCalledWith('high')
  })

  it('organizes settings into clear sections and explains control mapping', () => {
    const onClose = vi.fn()
    const onSettingChange = vi.fn()
    render(
      <Settings
        isVisible
        onClose={onClose}
        settings={{
          resolve: true,
          notation: 'solfege',
          instrument: 'piano',
          darkTheme: false,
          autoMode: false,
          autoInterval: 5000,
          showAnswer: true,
          sayAnswer: true
        }}
        onSettingChange={onSettingChange}
        exerciseSet={[60, 62, 64, 65]}
        tonicMidi={60}
        scaleType="major"
        notation="solfege"
        getKeyForMidi={() => null}
        startMapping={vi.fn()}
        clearKeymap={vi.fn()}
        waitingMapMidi={null}
        onKeyTest={vi.fn()}
        screenWakeLock={{ isSupported: true, isActive: false, error: null }}
        onResetProgress={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy()
    const notationSelect = screen.getByRole('combobox', { name: /Note labels/ })
    const instrumentSelect = screen.getByRole('combobox', { name: /Ear-training sound/ })
    expect(notationSelect.querySelectorAll('option')).toHaveLength(3)
    expect(instrumentSelect.querySelectorAll('option')).toHaveLength(2)
    fireEvent.change(notationSelect, { target: { value: 'degree' } })
    fireEvent.change(instrumentSelect, { target: { value: 'guitar' } })
    expect(onSettingChange).toHaveBeenCalledWith('notation', 'degree')
    expect(onSettingChange).toHaveBeenCalledWith('instrument', 'guitar')
    fireEvent.click(screen.getByRole('button', { name: /controls/i }))
    expect(screen.getByText('Why add controls?')).toBeTruthy()
    expect(screen.getByText(/same buttons work in every key and mode/i)).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows scale degrees independently of the sounding note name', () => {
    const { container, rerender } = render(
      <Piano
        exerciseSet={[60, 62, 64, 65]}
        tonicMidi={60}
        scaleType="major"
        notation="degree"
        disabled={false}
        onKeyClick={vi.fn()}
      />
    )

    expect(container.querySelector('[data-midi="60"] .label').textContent).toBe('1')
    expect(container.querySelector('[data-midi="64"] .label').textContent).toBe('3')

    rerender(
      <Piano
        exerciseSet={[62, 64, 66, 67]}
        tonicMidi={62}
        scaleType="major"
        notation="degree"
        disabled={false}
        onKeyClick={vi.fn()}
      />
    )

    expect(container.querySelector('[data-midi="62"] .label').textContent).toBe('1')
    expect(container.querySelector('[data-midi="66"] .label').textContent).toBe('3')
  })

  it('visually distinguishes scale notes on black keys after transposition', () => {
    const { container } = render(
      <Piano
        exerciseSet={[69, 71, 73, 74, 76, 78, 80, 81]}
        tonicMidi={69}
        notation="solfege"
        disabled={false}
        onKeyClick={vi.fn()}
      />
    )

    const scaleTone = container.querySelector('[data-midi="73"]')
    const chromaticTone = container.querySelector('[data-midi="72"]')

    expect(scaleTone.classList.contains('black')).toBe(true)
    expect(scaleTone.classList.contains('in-scope')).toBe(true)
    expect(scaleTone.querySelector('.label').textContent).toBe('do♯')
    expect(chromaticTone.classList.contains('out-of-scope')).toBe(true)
    expect(chromaticTone.querySelector('.label').textContent).toBe('')
  })

  it('renders the altered degrees of natural minor on the correct keys', () => {
    const { container } = render(
      <Piano
        exerciseSet={[69, 71, 72, 74, 76, 77, 79, 81]}
        tonicMidi={69}
        scaleType="naturalMinor"
        notation="solfege"
        disabled={false}
        onKeyClick={vi.fn()}
      />
    )

    expect(container.querySelector('[data-midi="72"] .label').textContent).toBe('do')
    expect(container.querySelector('[data-midi="79"] .label').textContent).toBe('sol')
    expect(container.querySelector('[data-midi="80"] .label').textContent).toBe('')
  })

  it('labels B-flat natural minor with fixed note names on the physical keys', () => {
    const { container } = render(
      <Piano
        exerciseSet={[70, 72, 73, 75]}
        tonicMidi={70}
        scaleType="naturalMinor"
        notation="solfege"
        disabled={false}
        onKeyClick={vi.fn()}
      />
    )

    const bFlatKey = container.querySelector('[data-midi="70"]')
    expect(bFlatKey.classList.contains('black')).toBe(true)
    expect(bFlatKey.classList.contains('in-scope')).toBe(true)
    expect(container.querySelector('[data-midi="70"] .label').textContent).toBe('si♭')
    expect(container.querySelector('[data-midi="72"] .label').textContent).toBe('do')
    expect(container.querySelector('[data-midi="73"] .label').textContent).toBe('re♭')
    expect(container.querySelector('[data-midi="75"] .label').textContent).toBe('mi♭')
  })

  it('keeps the same physical piano when the tonality changes', () => {
    const pianoProps = {
      notation: 'solfege',
      disabled: false,
      onKeyClick: vi.fn()
    }
    const { container, rerender } = render(
      <Piano
        {...pianoProps}
        exerciseSet={[60, 62, 64, 65]}
        tonicMidi={60}
        scaleType="major"
      />
    )
    const physicalLayout = Array.from(container.querySelectorAll('[data-midi]')).map(key => ({
      midi: key.dataset.midi,
      color: key.classList.contains('black') ? 'black' : 'white'
    }))

    rerender(
      <Piano
        {...pianoProps}
        exerciseSet={[70, 72, 73, 75]}
        tonicMidi={70}
        scaleType="naturalMinor"
      />
    )

    const transposedLayout = Array.from(container.querySelectorAll('[data-midi]')).map(key => ({
      midi: key.dataset.midi,
      color: key.classList.contains('black') ? 'black' : 'white'
    }))
    expect(transposedLayout).toEqual(physicalLayout)
    expect(container.querySelectorAll('.key.white')).toHaveLength(15)
    expect(container.querySelectorAll('.key.black')).toHaveLength(10)
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
