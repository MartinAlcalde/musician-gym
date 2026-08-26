import { useState, useEffect, useRef, useCallback } from 'react'
import { Piano, Settings, GameControls, GameDisplay, ExerciseSelector } from './components'
import { useAudio } from './hooks/useAudio.js'
import { useGameState } from './hooks/useGameState.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useAutoMode } from './hooks/useAutoMode.js'
import { useScreenWakeLock } from './hooks/useScreenWakeLock.js'
import { useManagedTimeouts } from './hooks/useManagedTimeouts.js'
import { labelForMidi, flashKey } from './utils/helpers.js'
import { STORAGE_KEYS, NOTES } from './utils/constants.js'
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
  const [initialAutoSettings] = useState(() => ({
    interval: Number(loadPreference(STORAGE_KEYS.AUTO_INTERVAL, '5000')) || 5000,
    showAnswer: loadBooleanPreference(STORAGE_KEYS.SHOW_ANSWER, true),
    sayAnswer: loadBooleanPreference(STORAGE_KEYS.SAY_ANSWER, true)
  }))

  // Refs
  const pianoRef = useRef(null)

  // Custom hooks
  const audio = useAudio()
  const gameState = useGameState()
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
        clickMidi(midi)
      })

      switch (result.type) {
        case 'start_triggered':
          document.getElementById("start")?.click()
          break
        case 'mapping_cancelled':
          setFeedback('Mapping cancelled')
          break
        case 'mapping_set':
          setFeedback(`Key mapped to ${labelForMidi(result.midi, notation)}`)
          break
        case 'no_action':
          // Do nothing
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [clickMidi, handleKeyboardKeyDown, notation])

  // Game logic functions
  const startRound = async () => {
    manualTimers.clearAll()
    await audio.startAudioContext()
    setManualSessionStarted(true)
    gameState.disableAnswers()
    setFeedback("Cadence…")
    setFeedbackOk(null)
    
    const endCad = audio.playCadence()
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
    
    const endCad = audio.playCadence()
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
          audio.playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
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
      />

      <Settings
        isVisible={settingsVisible}
        settings={settings}
        onSettingChange={handleSettingChange}
        exerciseSet={gameState.exerciseSet}
        notation={notation}
        getKeyForMidi={keyboard.getKeyForMidi}
        startMapping={(midi) => {
          keyboard.startMapping(midi)
          setFeedback(`Press a key for ${labelForMidi(midi, notation)} (Esc to cancel)`)
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
            setFeedback(`External control mapped to ${labelForMidi(waitingMidiValue, notation)}`)
            return
          }

          const legacyInputId = legacyGamepadInputId(testData)
          const midi = keyboard.getMidiForExternalInput(inputId) ?? (
            legacyInputId ? keyboard.getMidiForExternalInput(legacyInputId) : null
          )
          if (midi !== null) clickMidi(midi)
        }}
      />

      <Piano
        ref={pianoRef}
        exerciseSet={gameState.exerciseSet}
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
        onExerciseSelect={(exerciseNum) => handleSettingChange('exercise', exerciseNum)}
        onClose={() => setExerciseSelectorVisible(false)}
      />
    </div>
  )
}

export default App
