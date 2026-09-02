import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Piano,
  Settings,
  GameControls,
  GameDisplay,
  ExerciseSelector,
  TrainingSetup,
  SingingPractice,
  TinnitusPractice,
  HomeDashboard,
  RhythmPractice
} from './components'
import { useAudio } from './hooks/useAudio.js'
import { useGameState } from './hooks/useGameState.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useAutoMode } from './hooks/useAutoMode.js'
import { useScreenWakeLock } from './hooks/useScreenWakeLock.js'
import { useManagedTimeouts } from './hooks/useManagedTimeouts.js'
import {
  labelForMidi,
  flashKey,
  fromCanonicalDegreeMidi,
  getTonicMidi,
  getTonalityLabel
} from './utils/helpers.js'
import {
  STORAGE_KEYS,
  REGISTERS,
  SCALE_TYPES,
  INSTRUMENTS,
  NOTATION_OPTIONS
} from './utils/constants.js'
import { useI18n } from './i18n/I18nContext.jsx'
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

const APP_AREAS = new Set(['home', 'ear', 'singing', 'rhythm', 'tinnitus'])
const getInitialArea = () => {
  const requestedArea = globalThis.location?.hash?.slice(1)
  return APP_AREAS.has(requestedArea) ? requestedArea : 'home'
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
  const { locale, setLocale, t, speechLocale } = useI18n()
  // Main app state
  const [feedback, setFeedback] = useState({ key: 'feedback.loading' })
  const [feedbackOk, setFeedbackOk] = useState(null)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false)
  const [manualSessionStarted, setManualSessionStarted] = useState(false)
  const [activeArea, setActiveArea] = useState(getInitialArea)
  
  // Settings state
  const [resolve, setResolve] = useState(() => loadBooleanPreference(STORAGE_KEYS.RESOLVE, true))
  const [notation, setNotation] = useState(() => {
    const saved = loadPreference(STORAGE_KEYS.NOTATION, 'solfege')
    return NOTATION_OPTIONS.includes(saved) ? saved : 'solfege'
  })
  const [instrument, setInstrument] = useState(() => {
    const saved = loadPreference(STORAGE_KEYS.INSTRUMENT, 'piano')
    return INSTRUMENTS[saved] ? saved : 'piano'
  })
  const [darkTheme, setDarkTheme] = useState(() => loadBooleanPreference(STORAGE_KEYS.DARK_THEME, false))
  const [autoModeEnabled, setAutoModeEnabled] = useState(() => (
    loadBooleanPreference(STORAGE_KEYS.AUTO_MODE, false)
  ))
  const [tonicPc, setTonicPc] = useState(() => {
    const saved = Number(loadPreference(STORAGE_KEYS.TONIC_PC, '0'))
    return Number.isInteger(saved) && saved >= 0 && saved <= 11 ? saved : 0
  })
  const [scaleType, setScaleType] = useState(() => {
    const saved = loadPreference(STORAGE_KEYS.SCALE_TYPE, 'major')
    return SCALE_TYPES[saved] ? saved : 'major'
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
  const gameState = useGameState({ tonicMidi, scaleType, translate: t })
  const keyboard = useKeyboard()
  const autoMode = useAutoMode({
    notation,
    instrument,
    initialInterval: initialAutoSettings.interval,
    initialShowAnswer: initialAutoSettings.showAnswer,
    initialSayAnswer: initialAutoSettings.sayAnswer,
    translate: t,
    speechLocale
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

  useEffect(() => {
    const hash = activeArea === 'home' ? '' : `#${activeArea}`
    const url = `${location.pathname}${location.search}${hash}`
    history.replaceState(null, '', url)
  }, [activeArea])

  const clickMidi = useCallback((midi) => {
    const element = pianoRef.current?.querySelector(`[data-midi="${midi}"]`)
    element?.click()
  }, [])

  const actualMidiForMapping = useCallback((mappingMidi) => (
    fromCanonicalDegreeMidi(mappingMidi, tonicMidi, scaleType)
  ), [scaleType, tonicMidi])

  const handleKeyboardKeyDown = keyboard.handleKeyDown

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      const result = handleKeyboardKeyDown(event, (midi) => {
        const actualMidi = actualMidiForMapping(midi)
        if (actualMidi !== null) clickMidi(actualMidi)
      })

      switch (result.type) {
        case 'start_triggered':
          document.getElementById("start")?.click()
          break
        case 'mapping_cancelled':
          setFeedback({ key: 'feedback.mappingCancelled' })
          break
        case 'mapping_set': {
          const actualMidi = actualMidiForMapping(result.midi)
          if (actualMidi === null) break
          setFeedback({
            key: 'feedback.keyMapped',
            variables: { note: labelForMidi(actualMidi, notation, tonicPc, scaleType) }
          })
          break
        }
        case 'no_action':
          // Do nothing
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [actualMidiForMapping, clickMidi, handleKeyboardKeyDown, notation, scaleType, tonicPc])

  // Game logic functions
  const startRound = async () => {
    manualTimers.clearAll()
    await audio.startAudioContext()
    setManualSessionStarted(true)
    gameState.disableAnswers()
    setFeedback({ key: 'feedback.cadence' })
    setFeedbackOk(null)
    
    const endCad = audio.playCadence(tonicMidi, scaleType, instrument)
    const newTarget = gameState.startNewRound()
    
    const tTarget = endCad + 0.12
    audio.playTone(newTarget, tTarget, 0.9, instrument, 0.18)
    
    const currentTime = audio.getCurrentTime()
    const enableAtMs = currentTime !== null
      ? Math.max(0, (tTarget - currentTime) * 1000) + 120
      : 1000
    manualTimers.schedule(() => {
      setFeedback({ key: 'feedback.identify' })
      gameState.enableAnswers()
    }, enableAtMs)
  }

  const startAutoRound = () => {
    const newTarget = gameState.startNewRound()
    setFeedback({ key: 'feedback.cadence' })
    
    // Solo usar runAutoRound, que ya maneja todo el ciclo
    autoMode.runAutoRound(
      newTarget,
      tonicMidi,
      scaleType,
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
      setFeedback({ key: 'feedback.loading' })
      return
    }
    
    if (autoModeEnabled) {
      if (autoMode.isRunning) {
        autoMode.stop()
        void releaseWakeLock()
        setFeedback({ key: 'feedback.autoStopped' })
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
    setFeedback({ key: 'feedback.cadence' })
    setFeedbackOk(null)
    
    const endCad = audio.playCadence(tonicMidi, scaleType, instrument)
    const tTarget = endCad + 0.12
    audio.playTone(gameState.targetMidi, tTarget, 0.9, instrument, 0.18)
    
    const currentTime = audio.getCurrentTime()
    const enableAtMs = currentTime !== null
      ? Math.max(0, (tTarget - currentTime) * 1000) + 120
      : 1000
    manualTimers.schedule(() => {
      setFeedback({ key: 'feedback.identify' })
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
          audio.playTone(currentTarget, t0, 0.45, instrument, 0.16)
          audio.playTone(tonicMidi, t0 + 0.46, 0.8, instrument, 0.18)
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
        if (!NOTATION_OPTIONS.includes(value)) break
        setNotation(value)
        savePreference(STORAGE_KEYS.NOTATION, value)
        break
      case 'instrument':
        if (!INSTRUMENTS[value]) break
        manualTimers.clearAll()
        if (autoMode.isRunningRef.current) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback({ key: 'feedback.instrumentChanged' })
        setFeedbackOk(null)
        setInstrument(value)
        savePreference(STORAGE_KEYS.INSTRUMENT, value)
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
        setFeedback({ key: value ? 'feedback.autoReady' : 'feedback.manualReady' })
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
        setFeedback({ key: 'feedback.exerciseChanged' })
        setFeedbackOk(null)
        break
      case 'tonality': {
        const nextTonicPc = Number(value.tonicPc)
        const nextScaleType = SCALE_TYPES[value.scaleType] ? value.scaleType : null
        if (!Number.isInteger(nextTonicPc) || nextTonicPc < 0 || nextTonicPc > 11 || !nextScaleType) break
        manualTimers.clearAll()
        if (autoMode.isRunningRef.current) {
          autoMode.stop()
          void releaseWakeLock()
        }
        gameState.resetTarget()
        gameState.disableAnswers()
        setManualSessionStarted(false)
        setFeedback({ key: 'feedback.tonalityChanged' })
        setFeedbackOk(null)
        setTonicPc(nextTonicPc)
        setScaleType(nextScaleType)
        savePreference(STORAGE_KEYS.TONIC_PC, nextTonicPc)
        savePreference(STORAGE_KEYS.SCALE_TYPE, nextScaleType)
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
        setFeedback({ key: 'feedback.registerChanged' })
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
    instrument,
    darkTheme,
    autoMode: autoModeEnabled,
    autoInterval: autoMode.interval,
    showAnswer: autoMode.showAnswer,
    sayAnswer: autoMode.sayAnswer
  }

  const startEnabled = audio.isReady && (autoModeEnabled || !manualSessionStarted)
  const displayedFeedback = feedback.key === 'feedback.loading' && audio.isReady
    ? t('feedback.ready')
    : typeof feedback === 'string'
      ? feedback
      : t(feedback.key, feedback.variables)
  const tonalityLabel = getTonalityLabel(tonicPc, scaleType, t(`scale.${scaleType}.label`))

  const handleLanguageChange = nextLocale => {
    setLocale(nextLocale)
    setFeedback({ key: 'feedback.ready' })
  }

  const handleAreaChange = nextArea => {
    if (nextArea === activeArea) return
    manualTimers.clearAll()
    if (autoMode.isRunningRef.current) autoMode.stop()
    void releaseWakeLock()
    gameState.resetTarget()
    gameState.disableAnswers()
    setManualSessionStarted(false)
    setExerciseSelectorVisible(false)
    setFeedbackOk(null)
    setFeedback({ key: 'feedback.ready' })
    setActiveArea(nextArea)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <button
            type="button"
            className="brand-home-button"
            onClick={() => handleAreaChange('home')}
            aria-label={t('nav.home')}
          >
            <span className="brand-mark" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </span>
            <span className="brand-copy">
              <strong>Musician Gym</strong>
              <small>{t('app.disciplines')}</small>
            </span>
          </button>
          <h1 className="sr-only">Musician Gym</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="language-button"
            onClick={() => handleLanguageChange(locale === 'es' ? 'en' : 'es')}
            aria-label={t('language.switchTo', {
              language: t(locale === 'es' ? 'language.english' : 'language.spanish')
            })}
          >
            {locale === 'es' ? 'Es' : 'En'}
          </button>
          <button
            type="button"
            className="settings-button"
            onClick={() => setSettingsVisible(true)}
            aria-label={t('settings.open')}
          >
            <span aria-hidden="true">⚙</span> {t('settings.button')}
          </button>
        </div>
      </header>

      <nav className="product-nav" aria-label={t('nav.label')}>
        <button
          type="button"
          className={`product-nav-home ${activeArea === 'home' ? 'active' : ''}`}
          aria-current={activeArea === 'home' ? 'page' : undefined}
          onClick={() => handleAreaChange('home')}
        >
          <span aria-hidden="true">⌂</span>
          <strong>{t('nav.home')}</strong>
        </button>
        <div className="product-nav-primary" aria-label={t('nav.practice')}>
          <button
            type="button"
            className={activeArea === 'ear' ? 'active' : ''}
            aria-current={activeArea === 'ear' ? 'page' : undefined}
            onClick={() => handleAreaChange('ear')}
          >
            <span aria-hidden="true">◉</span>
            <span><strong>{t('nav.short.ear')}</strong><small>{t('nav.meta.ear')}</small></span>
          </button>
          <button
            type="button"
            className={activeArea === 'singing' ? 'active' : ''}
            aria-current={activeArea === 'singing' ? 'page' : undefined}
            onClick={() => handleAreaChange('singing')}
          >
            <span aria-hidden="true">◒</span>
            <span><strong>{t('nav.short.singing')}</strong><small>{t('nav.meta.singing')}</small></span>
          </button>
          <button
            type="button"
            className={activeArea === 'rhythm' ? 'active' : ''}
            aria-current={activeArea === 'rhythm' ? 'page' : undefined}
            onClick={() => handleAreaChange('rhythm')}
          >
            <span aria-hidden="true">♩</span>
            <span><strong>{t('nav.short.rhythm')}</strong><small>{t('nav.meta.rhythm')}</small></span>
            <b>R3</b>
          </button>
        </div>
        <button
          type="button"
          className={`product-nav-tool ${activeArea === 'tinnitus' ? 'active' : ''}`}
          aria-current={activeArea === 'tinnitus' ? 'page' : undefined}
          onClick={() => handleAreaChange('tinnitus')}
        >
          <span aria-hidden="true">⌁</span>
          <span><strong>{t('nav.short.tinnitus')}</strong><small>{t('nav.tools')}</small></span>
        </button>
      </nav>

      {(activeArea === 'ear' || activeArea === 'singing') && (
        <TrainingSetup
          tonicPc={tonicPc}
          scaleType={scaleType}
          register={register}
          showRegister={activeArea === 'ear'}
          onTonicChange={value => handleSettingChange('tonality', { tonicPc: value, scaleType })}
          onScaleTypeChange={value => handleSettingChange('tonality', { tonicPc, scaleType: value })}
          onRegisterChange={value => handleSettingChange('register', value)}
        />
      )}

      <Settings
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        settings={settings}
        onSettingChange={handleSettingChange}
        exerciseSet={gameState.exerciseSet}
        tonicMidi={tonicMidi}
        scaleType={scaleType}
        notation={notation}
        getKeyForMidi={keyboard.getKeyForMidi}
        startMapping={(mappingMidi) => {
          keyboard.startMapping(mappingMidi)
          const actualMidi = actualMidiForMapping(mappingMidi)
          if (actualMidi !== null) {
            setFeedback({
              key: 'feedback.pressKeyFor',
              variables: { note: labelForMidi(actualMidi, notation, tonicPc, scaleType) }
            })
          }
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
          setFeedback({ key: 'feedback.progressReset' })
          setFeedbackOk(null)
        }}
        onKeyTest={(testData) => {
          const inputId = testData.inputId
          if (!inputId) return

          const waitingMidiValue = keyboard.waitingMapMidiRef?.current
          if (waitingMidiValue !== null) {
            keyboard.setExternalInputMapping(waitingMidiValue, inputId)
            keyboard.cancelMapping()
            const actualMidi = actualMidiForMapping(waitingMidiValue)
            if (actualMidi !== null) {
              setFeedback({
                key: 'feedback.externalMapped',
                variables: { note: labelForMidi(actualMidi, notation, tonicPc, scaleType) }
              })
            }
            return
          }

          const legacyInputId = legacyGamepadInputId(testData)
          const midi = keyboard.getMidiForExternalInput(inputId) ?? (
            legacyInputId ? keyboard.getMidiForExternalInput(legacyInputId) : null
          )
          if (midi !== null) {
            const actualMidi = actualMidiForMapping(midi)
            if (actualMidi !== null) clickMidi(actualMidi)
          }
        }}
      />

      {activeArea === 'home' ? (
        <HomeDashboard
          onSelectArea={handleAreaChange}
          tonalityLabel={tonalityLabel}
          notationLabel={t(`settings.notation.${notation}`)}
          instrumentLabel={t(`settings.instrument.${instrument}`)}
          onOpenSettings={() => setSettingsVisible(true)}
        />
      ) : activeArea === 'ear' ? (
        <section className="practice-content" aria-label={t('nav.ear')}>
          <header className="workspace-heading">
            <div>
              <p className="eyebrow">{t('ear.eyebrow')}</p>
              <h2>{t('ear.title')}</h2>
              <p>{t('ear.intro')}</p>
            </div>
            <button type="button" className="workspace-settings" onClick={() => setSettingsVisible(true)}>
              ⚙ {t('ear.settings')}
            </button>
          </header>
          <GameControls
            onStart={handleStart}
            onRepeat={handleRepeat}
            onToggleExerciseSelector={() => setExerciseSelectorVisible(!exerciseSelectorVisible)}
            startEnabled={startEnabled}
            repeatEnabled={gameState.repeatEnabled}
            autoMode={autoModeEnabled}
            isAutoRunning={autoMode.isRunning}
            currentExercise={gameState.exercise}
            contextLabel={tonalityLabel}
          />

          <Piano
            ref={pianoRef}
            exerciseSet={gameState.exerciseSet}
            tonicMidi={tonicMidi}
            scaleType={scaleType}
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
            tonalityLabel={tonalityLabel}
            tonicMidi={tonicMidi}
            scaleType={scaleType}
            onExerciseSelect={(exerciseNum) => handleSettingChange('exercise', exerciseNum)}
            onClose={() => setExerciseSelectorVisible(false)}
          />
        </section>
      ) : activeArea === 'singing' ? (
        <SingingPractice
          key={`${scaleType}:${tonicMidi}`}
          audio={audio}
          tonicMidi={tonicMidi}
          scaleType={scaleType}
          notation={notation}
          screenWakeLock={screenWakeLock}
        />
      ) : activeArea === 'rhythm' ? (
        <RhythmPractice screenWakeLock={screenWakeLock} />
      ) : (
        <TinnitusPractice screenWakeLock={screenWakeLock} />
      )}
    </main>
  )
}

export default App
