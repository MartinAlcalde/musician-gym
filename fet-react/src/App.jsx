import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { Piano, Settings, GameControls, GameDisplay } from './components'
import { useAudio } from './hooks/useAudio.js'
import { useGameState } from './hooks/useGameState.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useAutoMode } from './hooks/useAutoMode.js'
import { labelForMidi, saveToStorage, loadFromStorage, flashKey } from './utils/helpers.js'
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
    try {
      const savedNotation = localStorage.getItem(STORAGE_KEYS.NOTATION) || 'solfege'
      const savedTheme = localStorage.getItem(STORAGE_KEYS.DARK_THEME) === 'true'
      const savedAutoMode = localStorage.getItem(STORAGE_KEYS.AUTO_MODE) === 'true' 
      const savedInterval = Number(localStorage.getItem(STORAGE_KEYS.AUTO_INTERVAL)) || 5000
      const savedShowAnswer = localStorage.getItem(STORAGE_KEYS.SHOW_ANSWER) !== 'false'
      const savedSayAnswer = localStorage.getItem(STORAGE_KEYS.SAY_ANSWER) === 'true'

      setNotation(savedNotation)
      setDarkTheme(savedTheme)
      setAutoModeEnabled(savedAutoMode)
      autoMode.setInterval(savedInterval)
      autoMode.setShowAnswer(savedShowAnswer)
      autoMode.setSayAnswer(savedSayAnswer)

      if (savedTheme) {
        document.body.classList.add('dark')
      }
    } catch (error) {
      console.warn('Error loading preferences:', error)
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
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_THEME, darkTheme)
    } catch {}
  }, [darkTheme])

  // Auto mode effect
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_MODE, autoModeEnabled)
    } catch {}
    
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
        case 'no_action':
          // Do nothing
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [keyboard, notation])

  // Game logic functions
  const startRound = async () => {
    console.log('🎯 startRound() called')
    await audio.startAudioContext()
    setStartEnabled(false)
    gameState.disableAnswers()
    setFeedback("Cadence…")
    setFeedbackOk(null)
    
    console.log('🎼 Playing cadence...')
    const endCad = audio.playCadence()
    const newTarget = gameState.startNewRound()
    console.log(`🎵 New target note: ${newTarget}`)
    
    const tTarget = endCad + 0.12
    audio.playTone(newTarget, tTarget, 0.9, "piano", 0.18)
    
    const ctx = audio.isReady ? Tone.getContext().rawContext : null
    const enableAtMs = ctx ? Math.max(0, (tTarget - ctx.currentTime) * 1000) + 120 : 1000
    console.log(`⏱️ Will enable answers in ${enableAtMs}ms`)
    setTimeout(() => {
      console.log('✅ Enabling answers now')
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
            const el = pianoRef.current.querySelector(`[data-midi="${result.targetMidi}"]`)
            if (el) flashKey(el, 'hint', 2000)
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
    
    const ctx = audio.isReady ? Tone.getContext().rawContext : null
    const enableAtMs = ctx ? Math.max(0, (tTarget - ctx.currentTime) * 1000) + 120 : 1000
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
      flashKey(keyElement, 'wrong')
      return
    }
    
    setFeedback(result.message)
    setFeedbackOk(result.isCorrect)
    flashKey(keyElement, result.isCorrect ? 'correct' : 'wrong')

    if (result.isCorrect) {
      console.log('✅ Correct answer! Starting next round sequence...')
      let nextDelayMs = 400
      const currentTarget = gameState.targetMidi // Save target before reset
      
      if (resolve) {
        console.log('🎵 Playing resolution...')
        const ctx = Tone.getContext().rawContext
        const t0 = ctx.currentTime + 0.05
        audio.playTone(currentTarget, t0, 0.45, 'piano', 0.16)
        audio.playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
        const tEnd = t0 + 0.46 + 0.82
        nextDelayMs = Math.max(0, (tEnd - ctx.currentTime) * 1000) + 120
        console.log(`⏱️ Resolution delay: ${nextDelayMs}ms`)
      } else {
        console.log(`⏱️ No resolution, delay: ${nextDelayMs}ms`)
      }
      
      gameState.disableAnswers()
      gameState.resetTarget()
      
      console.log(`⏰ Setting timeout for ${nextDelayMs}ms to start next round`)
      setTimeout(() => {
        console.log('🚀 Timeout fired! Starting next round...')
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
        try { localStorage.setItem(STORAGE_KEYS.NOTATION, value) } catch {}
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
        try { localStorage.setItem(STORAGE_KEYS.AUTO_INTERVAL, value) } catch {}
        break
      case 'showAnswer':
        autoMode.setShowAnswer(value)
        try { localStorage.setItem(STORAGE_KEYS.SHOW_ANSWER, value) } catch {}
        break
      case 'sayAnswer':
        autoMode.setSayAnswer(value)
        try { localStorage.setItem(STORAGE_KEYS.SAY_ANSWER, value) } catch {}
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
        exerciseSet={gameState.exerciseSet}
        notation={notation}
        getKeyForMidi={keyboard.getKeyForMidi}
        startMapping={(midi) => {
          keyboard.startMapping(midi)
          setFeedback(`Press a key for ${labelForMidi(midi, notation)} (Esc to cancel)`)
        }}
        clearKeymap={keyboard.clearKeymap}
        waitingMapMidi={keyboard.waitingMapMidi}
        onKeyTest={(testData) => {
          // Handle key test data from remote controls
          console.log('Key test:', testData)
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