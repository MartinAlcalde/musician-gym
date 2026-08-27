import { useState, useEffect, useRef, useCallback } from 'react'
import { Piano, Settings, GameControls, GameDisplay, ExerciseSelector } from './components'
import { useAudio } from './hooks/useAudio.js'
import { useGameState } from './hooks/useGameState.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useAutoMode } from './hooks/useAutoMode.js'
import { useScreenWakeLock } from './hooks/useScreenWakeLock.js'
import { useManagedTimeouts } from './hooks/useManagedTimeouts.js'
import { labelForMidi, flashKey, getTonicMidi } from './utils/helpers.js'
import { STORAGE_KEYS, NOTES, REGISTERS, TONALITIES } from './utils/constants.js'
import './App.css'

const savePreference = (key, value) => {
  try {
    localStorage.setItem(key, String(value))
  } catch (error) {
    console.warn(`Could not save preference ${key}:`, error)
  }
}

const loadPreference = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved === null ? fallback : saved
  } catch (error) {
    console.warn(`Could not load preference ${key}:`, error)
    return fallback
  }
}

const loadBooleanPreference = (key, fallback) => {
  return loadPreference(key, String(fallback)) === 'true'
}

const legacyGamepadInputId = testData => {
  if (testData.type !== 'gamepad') return null
  if (testData.buttonIndex !== undefined) {
    return `gamepad:${testData.gamepadIndex}:btn${testData.buttonIndex}`
  }
  if (testData.axisIndex !== undefined) {
    return `gamepad:${testData.gamepadIndex}:axis${testData.axisIndex}${testData.axisDirection}`
  }
  return null
}

function App() {
  // Main app state
  const [feedback, setFeedback] = useState("Loading piano…")
  const [feedbackOk, setFeedbackOk] = useState(null)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false)
  const [manualSessionStarted, setManualSessionStarted] = useState(false)
  
  // Settings state
  const [resolve, setResolve] = useState(() => loadBooleanPreference(STORAGE_KEYS.RESOLVE, true))
  const [notation, setNotation] = useState(() => loadPreference(STORAGE_KEYS.NOTATION, 'solfege'))
  const [darkTheme, setDarkTheme] = useState(() => loadBooleanPreference(STORAGE_KEYS.DARK_THEME, false))
  const [autoModeEnabled, setAutoModeEnabled] = useState(() => (
    loadBooleanPreference(STORAGE_KEYS.AUTO_MODE, false)
  ))
  const [tonicPc, setTonicPc] = useState(() => {
    const saved = Number(loadPreference(STORAGE_KEYS.TONIC_PC, '0'))
    return Number.isInteger(saved) && saved >= 0 && saved <= 11 ? saved : 0
  })
  const [register, setRegister] = useState(() => {
    const saved = loadPreference(STORAGE_KEYS.REGISTER, 'middle')
    return REGISTERS[saved] ? saved : 'middle'
  })
  const [initialAutoSettings] = useState(() => ({
    interval: Number(loadPreference(STORAGE_KEYS.AUTO_INTERVAL, '5000')) || 5000,
    showAnswer: loadBooleanPreference(STORAGE_KEYS.SHOW_ANSWER, true),
    sayAnswer: loadBooleanPreference(STORAGE_KEYS.SAY_ANSWER, true)
  }))

  // Refs
  const pianoRef = useRef(null)
  const tonicMidi = getTonicMidi(tonicPc, register)

  // Custom hooks
  const audio = useAudio()
  const gameState = useGameState({ tonicMidi })
  const keyboard = useKeyboard()
  const autoMode = useAutoMode({
    notation,
    initialInterval: initialAutoSettings.interval,
    initialShowAnswer: initialAutoSettings.showAnswer,
    initialSayAnswer: initialAutoSettings.sayAnswer
  })
  const screenWakeLock = useScreenWakeLock()
  const manualTimers = useManagedTimeouts()
  const {
    isSupported: isWakeLockSupported,
    isActive: isWakeLockActive,
    error: wakeLockError,
    request: requestWakeLock,
    release: releaseWakeLock
  } = screenWakeLock

  // Dark theme effect - only apply to DOM, don't save here
  useEffect(() => {
    document.body.classList.toggle('dark', darkTheme)
  }, [darkTheme])

  const clickMidi = useCallback((midi) => {
    const element = pianoRef.current?.querySelector(`[data-midi="${midi}"]`)
    element?.click()
  }, [])

  const handleKeyboardKeyDown = keyboard.handleKeyDown

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      const result = handleKeyboardKeyDown(event, (midi) => {
        clickMidi(tonicMidi + (midi - NOTES.C4))
      })

      switch (result.type) {
        case 'start_triggered':
          document.getElementById("start")?.click()
          break
        case 'mapping_cancelled':
          setFeedback('Mapping cancelled')
          break
        case 'mapping_set':
          setFeedback(`Key mapped to ${labelForMidi(
            tonicMidi + (result.midi - NOTES.C4),
            notation,
            tonicPc
          )}`)
          break
        case 'no_action':
          // Do nothing
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [clickMidi, handleKeyboardKeyDown, notation, tonicMidi, tonicPc])

  // Game logic functions
  const startRound = async () => {
    manualTimers.clearAll()
    await audio.startAudioContext()
    setManualSessionStarted(true)
    gameState.disableAnswers()
    setFeedback("Cadence…")
    setFeedbackOk(null)
    
    const endCad = audio.playCadence(tonicMidi)
    const newTarget = gameState.startNewRound()
    
    const tTarget = endCad + 0.12
    audio.playTone(newTarget, tTarget, 0.9, "piano", 0.18)
    
    const currentTime = audio.getCurrentTime()
    const enableAtMs = currentTime !== null
      ? Math.max(0, (tTarget - currentTime) * 1000) + 120
      : 1000
    manualTimers.schedule(() => {
      setFeedback("Identify the note (click the key)")
      gameState.enableAnswers()
    }, enableAtMs)
  }

  const startAutoRound = () => {
    const newTarget = gameState.startNewRound()
    setFeedback("🎵 Cadence...")
    
    // Solo usar runAutoRound, que ya maneja todo el ciclo
    autoMode.runAutoRound(
      newTarget,
      tonicMidi,
      audio.playCadence,
      audio.playTone,
      audio.getCurrentTime,
      () => {
        if (autoMode.isRunningRef.current) {
          startAutoRound() // Continue the loop
        }
      },
      // Pasar callback para actualizar UI
      (message, shouldHighlight, targetMidi) => {
        setFeedback(message)
        if (shouldHighlight && pianoRef.current) {
          const el = pianoRef.current.querySelector(`[data-midi="${targetMidi}"]`)
          if (el) flashKey(el, 'hint', 2000)
        }
      }
    )
  }

  const handleStart = async () => {
    if (!audio.isReady) {
      setFeedback("Loading piano…")
      return
    }
    
    if (autoModeEnabled) {
      if (autoMode.isRunning) {
        autoMode.stop()
        void releaseWakeLock()
        setFeedback('Auto mode stopped')
        gameState.resetTarget()
        gameState.disableAnswers()
      } else {
        manualTimers.clearAll()
        const wakeLockPromise = requestWakeLock()
        await audio.startAudioContext()
        autoMode.start()
        const wakeLockAcquired = await wakeLockPromise

        if (!wakeLockAcquired) {
          console.warn('Auto mode started without a screen wake lock')
        }

        startAutoRound()
      }
      return
    }
    
    if (gameState.targetMidi) return
    startRound()
  }

  const handleRepeat = () => {
    if (!gameState.targetMidi) return
    
    gameState.disableAnswers()
    setFeedback('Cadence…')
    setFeedbackOk(null)
    
    const endCad = audio.playCadence(tonicMidi)
    const tTarget = endCad + 0.12
    audio.playTone(gameState.targetMidi, tTarget, 0.9, 'piano', 0.18)
    
    const currentTime = audio.getCurrentTime()
    const enableAtMs = currentTime !== null
      ? Math.max(0, (tTarget - currentTime) * 1000) + 120
      : 1000
    manualTimers.schedule(() => {
      setFeedback('Identify the note (click the key)')
      gameState.enableAnswers()
    }, enableAtMs)
  }

  const handlePianoClick = (midi, keyElement) => {
    const result = gameState.submitAnswer(midi, notation)
    
    if (!result) return
    
    if (!result.isValid) {
      setFeedback(result.message)
      setFeedbackOk(false)
      flashKey(keyElement, 'wrong')
      return
    }
    
    setFeedback(result.message)
    setFeedbackOk(result.isCorrect)
    flashKey(keyElement, result.isCorrect ? 'correct' : 'wrong')

    if (result.isCorrect) {
      let nextDelayMs = 400
      const currentTarget = gameState.targetMidi // Save target before reset
      
      if (resolve) {
        const currentTime = audio.getCurrentTime()
        if (currentTime !== null) {
          const t0 = currentTime + 0.05
          audio.playTone(currentTarget, t0, 0.45, 'piano', 0.16)
          audio.playTone(tonicMidi, t0 + 0.46, 0.8, 'piano', 0.18)
          const tEnd = t0 + 0.46 + 0.82
          nextDelayMs = Math.max(0, (tEnd - currentTime) * 1000) + 120
        }
      }
      
      gameState.disableAnswers()
      gameState.resetTarget()
      
      manualTimers.schedule(() => {
        void startRound()
      }, nextDelayMs)
    }
  }

  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case 'resolve':
        setResolve(value)
        savePreference(STORAGE_KEYS.RESOLVE, value)
        break
      case 'notation':
        setNotation(value)
        savePreference(STORAGE_KEYS.NOTATION, value)
        break
      case 'darkTheme':
        setDarkTheme(value)
        savePreference(STORAGE_KEYS.DARK_THEME, value)
        break
      case 'autoMode':
        manualTimers.clearAll()
        if (!value && autoMode.isRunning) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback(value ? 'Auto mode ready. Press Start' : 'Manual mode ready. Press Start')
        setAutoModeEnabled(value)
        savePreference(STORAGE_KEYS.AUTO_MODE, value)
        break
      case 'exercise':
        manualTimers.clearAll()
        if (autoMode.isRunning) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.setExercise(value)
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback('Exercise changed. Press Start')
        setFeedbackOk(null)
        break
      case 'tonicPc': {
        const nextTonicPc = Number(value)
        if (!Number.isInteger(nextTonicPc) || nextTonicPc < 0 || nextTonicPc > 11) break
        manualTimers.clearAll()
        if (autoMode.isRunningRef.current) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback('Tonality changed. Press Start')
        setFeedbackOk(null)
        setTonicPc(nextTonicPc)
        savePreference(STORAGE_KEYS.TONIC_PC, nextTonicPc)
        break
      }
      case 'register':
        if (!REGISTERS[value]) break
        manualTimers.clearAll()
        if (autoMode.isRunningRef.current) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback('Register changed. Press Start')
        setFeedbackOk(null)
        setRegister(value)
        savePreference(STORAGE_KEYS.REGISTER, value)
        break
      case 'autoInterval':
        autoMode.setInterval(value)
        savePreference(STORAGE_KEYS.AUTO_INTERVAL, value)
        break
      case 'showAnswer':
        autoMode.setShowAnswer(value)
        savePreference(STORAGE_KEYS.SHOW_ANSWER, value)
        break
      case 'sayAnswer':
        autoMode.setSayAnswer(value)
        savePreference(STORAGE_KEYS.SAY_ANSWER, value)
        break
    }
  }

  // Settings object for the Settings component
  const settings = {
    resolve,
    notation,
    darkTheme,
    autoMode: autoModeEnabled,
    autoInterval: autoMode.interval,
    showAnswer: autoMode.showAnswer,
    sayAnswer: autoMode.sayAnswer
  }

  const startEnabled = audio.isReady && (autoModeEnabled || !manualSessionStarted)
  const displayedFeedback = feedback === 'Loading piano…' && audio.isReady
    ? 'Ready. Press Start'
    : feedback

  return (
    <div>
      <h1>Musician Gym</h1>
      
      <GameControls
        onStart={handleStart}
        onRepeat={handleRepeat}
        onToggleSettings={() => setSettingsVisible(!settingsVisible)}
        onToggleExerciseSelector={() => setExerciseSelectorVisible(!exerciseSelectorVisible)}
        startEnabled={startEnabled}
        repeatEnabled={gameState.repeatEnabled}
        autoMode={autoModeEnabled}
        isAutoRunning={autoMode.isRunning}
        currentExercise={gameState.exercise}
        tonicPc={tonicPc}
        register={register}
        onTonicChange={value => handleSettingChange('tonicPc', value)}
        onRegisterChange={value => handleSettingChange('register', value)}
      />

      <Settings
        isVisible={settingsVisible}
        settings={settings}
        onSettingChange={handleSettingChange}
        exerciseSet={gameState.exerciseSet}
        tonicMidi={tonicMidi}
        notation={notation}
        getKeyForMidi={keyboard.getKeyForMidi}
        startMapping={(mappingMidi) => {
          keyboard.startMapping(mappingMidi)
          const actualMidi = tonicMidi + (mappingMidi - NOTES.C4)
          setFeedback(`Press a key for ${labelForMidi(actualMidi, notation, tonicPc)} (Esc to cancel)`)
        }}
        clearKeymap={keyboard.clearKeymap}
        waitingMapMidi={keyboard.waitingMapMidi}
        screenWakeLock={{
          isSupported: isWakeLockSupported,
          isActive: isWakeLockActive,
          error: wakeLockError
        }}
        onResetProgress={() => {
          gameState.resetStats()
          setFeedback('Progress reset')
          setFeedbackOk(null)
        }}
        onKeyTest={(testData) => {
          const inputId = testData.inputId
          if (!inputId) return

          const waitingMidiValue = keyboard.waitingMapMidiRef?.current
          if (waitingMidiValue !== null) {
            keyboard.setExternalInputMapping(waitingMidiValue, inputId)
            keyboard.cancelMapping()
            const actualMidi = tonicMidi + (waitingMidiValue - NOTES.C4)
            setFeedback(`External control mapped to ${labelForMidi(actualMidi, notation, tonicPc)}`)
            return
          }

          const legacyInputId = legacyGamepadInputId(testData)
          const midi = keyboard.getMidiForExternalInput(inputId) ?? (
            legacyInputId ? keyboard.getMidiForExternalInput(legacyInputId) : null
          )
          if (midi !== null) clickMidi(tonicMidi + (midi - NOTES.C4))
        }}
      />

      <Piano
        ref={pianoRef}
        exerciseSet={gameState.exerciseSet}
        tonicMidi={tonicMidi}
        notation={notation}
        disabled={!gameState.answersEnabled}
        onKeyClick={handlePianoClick}
      />

      <GameDisplay
        feedback={displayedFeedback}
        feedbackOk={feedbackOk}
        attempts={gameState.attempts}
        correct={gameState.correct}
        accuracy={gameState.accuracy}
      />

      <ExerciseSelector
        isVisible={exerciseSelectorVisible}
        currentExercise={gameState.exercise}
        tonalityLabel={TONALITIES.find(option => option.value === tonicPc)?.label}
        onExerciseSelect={(exerciseNum) => handleSettingChange('exercise', exerciseNum)}
        onClose={() => setExerciseSelectorVisible(false)}
      />
    </div>
  )
}

export default App
