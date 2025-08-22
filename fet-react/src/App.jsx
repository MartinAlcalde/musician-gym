import { useState, useEffect, useRef } from 'react'
import { Piano, Settings, GameControls, GameDisplay } from './components'
import { useAudio } from './hooks/useAudio.js'
import { useGameState } from './hooks/useGameState.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useAutoMode } from './hooks/useAutoMode.js'
import { labelForMidi, saveToStorage, loadFromStorage } from './utils/helpers.js'
import { STORAGE_KEYS, NOTES } from './utils/constants.js'
import './App.css'

function App() {
  // Main app state
  const [feedback, setFeedback] = useState("Loading piano…")
  const [feedbackOk, setFeedbackOk] = useState(null)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [startEnabled, setStartEnabled] = useState(false)
  
  // Settings state
  const [resolve, setResolve] = useState(true)
  const [notation, setNotation] = useState('solfege')
  const [darkTheme, setDarkTheme] = useState(false)
  const [autoModeEnabled, setAutoModeEnabled] = useState(false)

  // Refs
  const pianoRef = useRef(null)

  // Custom hooks
  const audio = useAudio()
  const gameState = useGameState()
  const keyboard = useKeyboard()
  const autoMode = useAutoMode()

  // Initialize app and load settings
  useEffect(() => {
    // Load saved preferences
    const savedNotation = loadFromStorage(STORAGE_KEYS.NOTATION, 'solfege')
    const savedTheme = loadFromStorage(STORAGE_KEYS.DARK_THEME, false)
    const savedAutoMode = loadFromStorage(STORAGE_KEYS.AUTO_MODE, false)
    const savedInterval = loadFromStorage(STORAGE_KEYS.AUTO_INTERVAL, 5000)
    const savedShowAnswer = loadFromStorage(STORAGE_KEYS.SHOW_ANSWER, true)
    const savedSayAnswer = loadFromStorage(STORAGE_KEYS.SAY_ANSWER, false)

    setNotation(savedNotation)
    setDarkTheme(savedTheme)
    setAutoModeEnabled(savedAutoMode)
    autoMode.setInterval(savedInterval)
    autoMode.setShowAnswer(savedShowAnswer)
    autoMode.setSayAnswer(savedSayAnswer)

    if (savedTheme) {
      document.body.classList.add('dark')
    }
  }, [])

  // Audio ready effect
  useEffect(() => {
    if (audio.isReady) {
      setFeedback("Ready. Press Start")
      setStartEnabled(true)
    }
  }, [audio.isReady])

  // Dark theme effect
  useEffect(() => {
    document.body.classList.toggle('dark', darkTheme)
    saveToStorage(STORAGE_KEYS.DARK_THEME, darkTheme)
  }, [darkTheme])

  // Auto mode effect
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AUTO_MODE, autoModeEnabled)
    
    if (!autoModeEnabled && autoMode.isRunning) {
      autoMode.stop()
      setFeedback('Auto mode disabled')
      gameState.resetTarget()
      gameState.disableAnswers()
    }
  }, [autoModeEnabled])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      const result = keyboard.handleKeyDown(event, (midi) => {
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
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [keyboard, notation])

  // Game logic functions
  const startRound = async () => {
    await audio.startAudioContext()
    setStartEnabled(false)
    gameState.disableAnswers()
    setFeedback("Cadence…")
    setFeedbackOk(null)
    
    const endCad = audio.playCadence()
    const newTarget = gameState.startNewRound()
    
    const tTarget = endCad + 0.12
    audio.playTone(newTarget, tTarget, 0.9, "piano", 0.18)
    
    const enableAtMs = Math.max(0, (tTarget - performance.now() / 1000) * 1000) + 120
    setTimeout(() => {
      setFeedback("Identify the note (click the key)")
      gameState.enableAnswers()
    }, enableAtMs)
  }

  const startAutoRound = () => {
    const newTarget = gameState.startNewRound()
    setFeedback("🎵 Cadence...")
    
    autoMode.runAutoRound(
      newTarget,
      audio.playCadence,
      audio.playTone,
      () => {
        if (autoMode.isRunning) {
          startAutoRound() // Continue the loop
        }
      }
    )

    // Show answer after delay
    setTimeout(() => {
      if (autoMode.isRunning) {
        setFeedback("🎧 Listen...")
        
        setTimeout(() => {
          const result = autoMode.showAutoAnswer(newTarget, audio.playTone, () => {
            if (autoMode.isRunning) {
              startAutoRound()
            }
          })
          
          setFeedback(result.message)
          if (result.shouldHighlight && pianoRef.current) {
            Piano.highlightKey(pianoRef.current, result.targetMidi, 2000)
          }
        }, 2000)
      }
    }, 200)
  }

  const handleStart = async () => {
    if (!audio.isReady) {
      setFeedback("Loading piano…")
      return
    }
    
    if (autoModeEnabled) {
      if (autoMode.isRunning) {
        autoMode.stop()
        setFeedback('Auto mode stopped')
        gameState.resetTarget()
        gameState.disableAnswers()
      } else {
        autoMode.start()
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
    
    const enableAtMs = Math.max(0, (tTarget - performance.now() / 1000) * 1000) + 120
    setTimeout(() => {
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
      Piano.flashKey(keyElement, 'wrong')
      return
    }
    
    setFeedback(result.message)
    setFeedbackOk(result.isCorrect)
    Piano.flashKey(keyElement, result.isCorrect ? 'correct' : 'wrong')

    if (result.isCorrect) {
      let nextDelayMs = 400
      
      if (resolve) {
        const t0 = performance.now() / 1000 + 0.05
        audio.playTone(gameState.targetMidi, t0, 0.45, 'piano', 0.16)
        audio.playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
        const tEnd = t0 + 0.46 + 0.82
        nextDelayMs = Math.max(0, (tEnd - performance.now() / 1000) * 1000) + 120
      }
      
      gameState.disableAnswers()
      gameState.resetTarget()
      
      setTimeout(() => {
        startRound()
      }, nextDelayMs)
    }
  }

  const clickMidi = (midi) => {
    const el = pianoRef.current?.querySelector(`[data-midi="${midi}"]`)
    if (el) el.click()
  }

  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case 'resolve':
        setResolve(value)
        break
      case 'notation':
        setNotation(value)
        saveToStorage(STORAGE_KEYS.NOTATION, value)
        break
      case 'darkTheme':
        setDarkTheme(value)
        break
      case 'autoMode':
        setAutoModeEnabled(value)
        break
      case 'exercise':
        gameState.setExercise(value)
        if (gameState.targetMidi) {
          gameState.resetTarget()
          gameState.disableAnswers()
          setStartEnabled(true)
          setFeedback('Exercise changed. Press Start')
        }
        break
      case 'autoInterval':
        autoMode.setInterval(value)
        saveToStorage(STORAGE_KEYS.AUTO_INTERVAL, value)
        break
      case 'showAnswer':
        autoMode.setShowAnswer(value)
        saveToStorage(STORAGE_KEYS.SHOW_ANSWER, value)
        break
      case 'sayAnswer':
        autoMode.setSayAnswer(value)
        saveToStorage(STORAGE_KEYS.SAY_ANSWER, value)
        break
    }
  }

  // Settings object for the Settings component
  const settings = {
    resolve,
    notation,
    darkTheme,
    autoMode: autoModeEnabled,
    exercise: gameState.exercise,
    autoInterval: autoMode.interval,
    showAnswer: autoMode.showAnswer,
    sayAnswer: autoMode.sayAnswer
  }

  return (
    <div>
      <h1>Functional Ear Training</h1>
      
      <GameControls
        onStart={handleStart}
        onRepeat={handleRepeat}
        onToggleSettings={() => setSettingsVisible(!settingsVisible)}
        startEnabled={startEnabled}
        repeatEnabled={gameState.repeatEnabled}
        autoMode={autoModeEnabled}
        isAutoRunning={autoMode.isRunning}
      />

      <Settings
        isVisible={settingsVisible}
        settings={settings}
        onSettingChange={handleSettingChange}
        autoMode={autoModeEnabled}
      />

      <Piano
        ref={pianoRef}
        exerciseSet={gameState.exerciseSet}
        notation={notation}
        disabled={!gameState.answersEnabled}
        onKeyClick={handlePianoClick}
      />

      <GameDisplay
        feedback={feedback}
        feedbackOk={feedbackOk}
        attempts={gameState.attempts}
        correct={gameState.correct}
        accuracy={gameState.accuracy}
      />
    </div>
  )
}

export default App