import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import './App.css'

function App() {
  // Game state
  const [running, setRunning] = useState(false)
  const [targetMidi, setTargetMidi] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [answersEnabled, setAnswersEnabled] = useState(false)
  const [notation, setNotation] = useState('solfege')
  const [exercise, setExercise] = useState(1)
  const [feedback, setFeedback] = useState("Loading piano…")
  const [feedbackOk, setFeedbackOk] = useState(null)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [resolve, setResolve] = useState(true)
  const [darkTheme, setDarkTheme] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [autoInterval, setAutoInterval] = useState(5000)
  const [showAnswer, setShowAnswer] = useState(true)
  const [sayAnswer, setSayAnswer] = useState(false)
  const [startEnabled, setStartEnabled] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)

  // Refs for audio and DOM manipulation
  const samplerRef = useRef(null)
  const pianoRef = useRef(null)
  const autoTimerRef = useRef(null)
  const keymapRef = useRef({})
  const waitingMapMidiRef = useRef(null)
  const bluetoothDeviceRef = useRef(null)
  const bluetoothCharacteristicRef = useRef(null)
  const gamepadIndexRef = useRef(-1)
  const gamepadButtonsRef = useRef([])
  const gamepadAxesRef = useRef([])
  const axisThresholdRef = useRef(0.5)

  // Constants - exactly as in original
  const NOTES = {
    C4: 60, Cs4: 61, D4: 62, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, As4: 70, B4: 71, C5: 72,
    B3: 59, G3: 55, D5: 74
  }
  const MIDI_TO_NAME = { 55: "G3", 59: "B3", 60: "C4", 61: "C#4", 62: "D4", 63: "D#4", 64: "E4", 65: "F4", 66: "F#4", 67: "G4", 68: "G#4", 69: "A4", 70: "A#4", 71: "B4", 72: "C5", 74: "D5" }
  const PC_TO_SOLFEGE = { 0: 'do', 1: 'do#', 2: 're', 3: 're#', 4: 'mi', 5: 'fa', 6: 'fa#', 7: 'sol', 8: 'sol#', 9: 'la', 10: 'la#', 11: 'si' }
  const PC_TO_LETTER = { 0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' }

  // Initialize audio system
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Load piano samples from the public file
        const script = document.createElement('script')
        script.src = '/piano.base64.js'
        script.onload = () => {
          if (window.PIANO_BASE64) {
            samplerRef.current = new Tone.Sampler({
              urls: {
                A2: window.PIANO_BASE64.A2,
                A3: window.PIANO_BASE64.A3,
                A4: window.PIANO_BASE64.A4,
                A5: window.PIANO_BASE64.A5,
                C3: window.PIANO_BASE64.C3,
                C4: window.PIANO_BASE64.C4,
                C5: window.PIANO_BASE64.C5,
                C6: window.PIANO_BASE64.C6,
              },
              release: 1.2,
              onload: () => {
                setFeedback("Ready. Press Start")
                setStartEnabled(true)
              },
              onerror: (e) => {
                setFeedback("Error cargando piano")
              }
            }).toDestination()
          }
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Audio initialization error:', error)
      }
    }

    initAudio()
    
    // Load saved preferences
    try {
      const savedNotation = localStorage.getItem('fet-notation')
      if (savedNotation === 'solfege' || savedNotation === 'letter') {
        setNotation(savedNotation)
      }
      
      const savedTheme = localStorage.getItem('fet-dark-theme')
      if (savedTheme === 'true') {
        setDarkTheme(true)
        document.body.classList.add('dark')
      }
      
      const savedAutoMode = localStorage.getItem('fet-auto-mode')
      if (savedAutoMode === 'true') {
        setAutoMode(true)
      }
      
      const savedInterval = localStorage.getItem('fet-auto-interval')
      if (savedInterval) {
        setAutoInterval(Number(savedInterval))
      }
      
      const savedShowAnswer = localStorage.getItem('fet-show-answer')
      if (savedShowAnswer === 'false') {
        setShowAnswer(false)
      }
      
      const savedSayAnswer = localStorage.getItem('fet-say-answer')
      if (savedSayAnswer === 'true') {
        setSayAnswer(true)
      }

      // Load keymap
      const rawKeymap = localStorage.getItem('fet-keymap')
      if (rawKeymap) {
        keymapRef.current = JSON.parse(rawKeymap) || {}
      } else {
        keymapRef.current = { a: NOTES.C4, s: NOTES.D4, d: NOTES.E4, f: NOTES.F4, g: NOTES.G4, h: NOTES.A4, j: NOTES.B4, k: NOTES.C5 }
        localStorage.setItem('fet-keymap', JSON.stringify(keymapRef.current))
      }
    } catch {}

    // Keyboard event listener
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        document.getElementById("start")?.click()
      }
      
      const ids = idsFromEvent(e)
      for (const id of ids) {
        if (keymapRef.current[id] != null) {
          e.preventDefault()
          clickMidi(keymapRef.current[id])
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current)
      }
    }
  }, [])

  // Dark theme effect
  useEffect(() => {
    document.body.classList.toggle('dark', darkTheme)
    try { 
      localStorage.setItem('fet-dark-theme', darkTheme) 
    } catch {}
  }, [darkTheme])

  // Auto mode effect
  useEffect(() => {
    try { 
      localStorage.setItem('fet-auto-mode', autoMode) 
    } catch {}
  }, [autoMode])

  // Exercise functions - exactly as original
  const getExerciseSet = () => {
    switch (exercise) {
      case 1: return [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4]
      case 2: return [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5]
      case 3: return [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5]
      default: return [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4]
    }
  }

  const pickRandomTargetMidi = () => {
    const set = getExerciseSet()
    return set[Math.floor(Math.random() * set.length)]
  }

  const playTone = (midi, when, dur = 0.6, type = "sine", gainVal = 0.15) => {
    const name = MIDI_TO_NAME[midi]
    if (!(samplerRef.current && name)) return
    const delay = Math.max(0, when - Tone.now())
    const t = Tone.now() + delay
    const vel = Math.max(0.05, Math.min(1, gainVal * 6))
    samplerRef.current.triggerAttackRelease(name, dur, t, vel)
  }

  const playChord = (midis, when, dur = 0.7, type = "piano", chordGain = 0.24) => {
    const perVoice = chordGain / Math.max(1, midis.length)
    midis.forEach(m => playTone(m, when, dur, type, perVoice))
  }

  const playCadence = () => {
    const t0 = Tone.now() + 0.05
    const step = 0.65
    playChord([NOTES.C4, NOTES.E4, NOTES.G4], t0, step, "piano")
    playChord([NOTES.C4, NOTES.F4, NOTES.A4], t0 + step, step, "piano")
    playChord([NOTES.B3, NOTES.D4, NOTES.G4], t0 + 2*step, step, "piano")
    playChord([NOTES.C4, NOTES.E4, NOTES.G4], t0 + 3*step, step, "piano")
    return t0 + 4*step
  }

  const labelForMidi = (midi) => {
    const pc = midi % 12
    return notation === 'solfege' ? (PC_TO_SOLFEGE[pc] || '') : (PC_TO_LETTER[pc] || '')
  }

  const startRound = () => {
    setStartEnabled(false)
    setAnswersEnabled(false)
    setRepeatEnabled(false)
    setFeedback("Cadence…")
    setFeedbackOk(null)
    
    const endCad = playCadence()
    const newTarget = pickRandomTargetMidi()
    setTargetMidi(newTarget)
    
    const tTarget = endCad + 0.12
    playTone(newTarget, tTarget, 0.9, "piano", 0.18)
    
    const enableAtMs = Math.max(0, (tTarget - Tone.now()) * 1000) + 120
    setTimeout(() => {
      setFeedback("Identify the note (click the key)")
      setAnswersEnabled(true)
      setRepeatEnabled(true)
    }, enableAtMs)
  }

  const handleStart = async () => {
    if (!samplerRef.current) {
      setFeedback("Loading piano…")
      return
    }
    
    await Tone.start()
    
    if (autoMode) {
      if (running) {
        stopAutoMode()
      } else {
        startAutoMode()
      }
      return
    }
    
    if (targetMidi) return
    startRound()
  }

  const handleRepeat = () => {
    if (!targetMidi) return
    setAnswersEnabled(false)
    setRepeatEnabled(false)
    setFeedback('Cadence…')
    setFeedbackOk(null)
    
    const endCad = playCadence()
    const tTarget = endCad + 0.12
    playTone(targetMidi, tTarget, 0.9, 'piano', 0.18)
    
    const enableAtMs = Math.max(0, (tTarget - Tone.now()) * 1000) + 120
    setTimeout(() => {
      setFeedback('Identify the note (click the key)')
      setAnswersEnabled(true)
      setRepeatEnabled(true)
    }, enableAtMs)
  }

  const startAutoMode = () => {
    if (!autoMode) return
    setRunning(true)
    runAutoRound()
  }

  const runAutoRound = () => {
    if (!autoMode || !running) return
    
    setFeedback("🎵 Cadence...")
    const endCad = playCadence()
    const newTarget = pickRandomTargetMidi()
    setTargetMidi(newTarget)
    
    const tTarget = endCad + 0.12
    playTone(newTarget, tTarget, 0.9, "piano", 0.18)
    
    const listenDelay = Math.max(0, (tTarget - Tone.now()) * 1000) + 200
    setTimeout(() => {
      setFeedback("🎧 Listen...")
      setTimeout(() => {
        showAutoAnswer(newTarget)
      }, 2000)
    }, listenDelay)
  }

  const showAutoAnswer = (target) => {
    if (!autoMode || !running) return
    
    const targetLabel = labelForMidi(target)
    
    if (showAnswer) {
      setFeedback(`✨ Answer: ${targetLabel}`)
      highlightKey(target, 2000)
    } else {
      setFeedback("🎵 (Answer hidden)")
    }
    
    let speechDuration = 0
    let resolutionDuration = 0
    
    if (sayAnswer && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(targetLabel)
      utterance.rate = 0.8
      utterance.pitch = 1.0
      speechDuration = Math.max(1000, targetLabel.length * 200)
      speechSynthesis.speak(utterance)
    }
    
    if (resolve) {
      const resolutionDelay = speechDuration + 300
      
      setTimeout(() => {
        if (autoMode && running) {
          const t0 = Tone.now() + 0.1
          playTone(target, t0, 0.45, 'piano', 0.16)
          playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
        }
      }, resolutionDelay)
      
      resolutionDuration = resolutionDelay + 1400
    }
    
    const usedTime = 2000 + Math.max(speechDuration, 0) + resolutionDuration + 1500
    const delay = Math.max(3000, autoInterval - usedTime)
    
    autoTimerRef.current = setTimeout(() => {
      if (autoMode && running) {
        runAutoRound()
      }
    }, delay)
  }

  const stopAutoMode = () => {
    setRunning(false)
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    setFeedback(autoMode ? 'Auto mode stopped' : 'Ready')
    setTargetMidi(null)
    setAnswersEnabled(!autoMode)
    setRepeatEnabled(false)
  }

  const onPianoClick = (e) => {
    const keyEl = e.target.closest('[data-midi]')
    if (!keyEl || !answersEnabled || !targetMidi) return
    
    const midi = Number(keyEl.dataset.midi)
    const allowed = new Set(getExerciseSet())
    
    if (!allowed.has(midi)) {
      setFeedback('Only notes in the highlighted range')
      setFeedbackOk(false)
      flashKey(keyEl, 'wrong')
      return
    }
    
    const ok = midi === targetMidi
    setAttempts(prev => prev + 1)
    if (ok) setCorrect(prev => prev + 1)
    
    const correctLabel = labelForMidi(targetMidi)
    setFeedback(ok ? '✓ Correct' : `✗ Wrong (it was ${correctLabel})`)
    setFeedbackOk(ok)
    flashKey(keyEl, ok ? 'correct' : 'wrong')

    if (ok) {
      let nextDelayMs = 400
      if (resolve) {
        const t0 = Tone.now() + 0.05
        playTone(targetMidi, t0, 0.45, 'piano', 0.16)
        playTone(NOTES.C4, t0 + 0.46, 0.8, 'piano', 0.18)
        const tEnd = t0 + 0.46 + 0.82
        nextDelayMs = Math.max(0, (tEnd - Tone.now()) * 1000) + 120
      }
      
      setAnswersEnabled(false)
      setRepeatEnabled(false)
      setTargetMidi(null)
      
      setTimeout(() => {
        startRound()
      }, nextDelayMs)
    }
  }

  const clickMidi = (midi) => {
    const el = pianoRef.current?.querySelector(`[data-midi="${midi}"]`)
    if (el) el.click()
  }

  const flashKey = (el, cls, ms = 250) => {
    el.classList.add('active', cls)
    setTimeout(() => el.classList.remove('active', cls), ms)
  }

  const highlightKey = (midi, ms = 300) => {
    const el = pianoRef.current?.querySelector(`[data-midi="${midi}"]`)
    if (el) flashKey(el, 'hint', ms)
  }

  const idsFromEvent = (e) => {
    const ids = []
    const k = (e.key || '').toLowerCase()
    const c = (e.code || '').toLowerCase()
    
    if (k && k !== 'unidentified') {
      ids.push(k)
      ids.push(`key:${k}`)
    }
    if (c && c !== 'unidentified') {
      ids.push(`code:${c}`)
    }
    
    return ids
  }

  // Build piano keys
  const buildPianoKeys = () => {
    const whites = [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5]
    const allowedSet = new Set(getExerciseSet())
    const useSolfege = notation === 'solfege'
    
    const hasSharpAfter = (midi) => {
      const pc = midi % 12
      return pc === 0 || pc === 2 || pc === 5 || pc === 7 || pc === 9
    }

    const keys = []
    
    // White keys
    whites.forEach((midi, index) => {
      const pc = midi % 12
      const text = useSolfege ? (PC_TO_SOLFEGE[pc] || '') : (PC_TO_LETTER[pc] || '')
      const inScope = allowedSet.has(midi)
      
      keys.push(
        <div
          key={midi}
          className={`key white ${inScope ? 'in-scope' : 'out-of-scope'}`}
          data-midi={midi}
          data-note={MIDI_TO_NAME[midi] || ''}
        >
          <div className="label">{text}</div>
        </div>
      )
    })
    
    // Black keys - positioned absolutely like original
    whites.forEach((midi, index) => {
      if (hasSharpAfter(midi) && midi !== NOTES.C5) {
        const blackMidi = midi + 1
        const pc = blackMidi % 12
        const text = useSolfege ? (PC_TO_SOLFEGE[pc] || '') : (PC_TO_LETTER[pc] || '')
        
        keys.push(
          <div
            key={blackMidi}
            className="key black"
            data-midi={blackMidi}
            data-note={MIDI_TO_NAME[blackMidi] || ''}
            data-black-for={midi}
          >
            <div className="label">{text}</div>
          </div>
        )
      }
    })
    
    return keys
  }

  // Position black keys after render (like original)
  useEffect(() => {
    const positionBlackKeys = () => {
      if (!pianoRef.current) return
      
      const pianoRect = pianoRef.current.getBoundingClientRect()
      const styles = getComputedStyle(pianoRef.current)
      const gap = parseFloat(styles.getPropertyValue('--gap')) || 2
      
      pianoRef.current.querySelectorAll('.key.black').forEach(black => {
        const whiteMidi = Number(black.dataset.blackFor)
        const whiteEl = pianoRef.current.querySelector(`.key.white[data-midi="${whiteMidi}"]`)
        if (!whiteEl) return
        
        const wRect = whiteEl.getBoundingClientRect()
        const bRect = black.getBoundingClientRect()
        const left = (wRect.left - pianoRect.left) + whiteEl.offsetWidth - (black.offsetWidth / 2) + (gap / 2)
        black.style.left = `${left}px`
      })
    }

    // Position after initial render and on resize
    positionBlackKeys()
    window.addEventListener('resize', positionBlackKeys)
    
    return () => window.removeEventListener('resize', positionBlackKeys)
  }, [exercise, notation]) // Re-run when piano content changes

  const accuracy = attempts ? Math.round((100 * correct) / attempts) : 0

  return (
    <div>
      <h1>Functional Ear Training</h1>
      
      <div className="row">
        <button id="start" onClick={handleStart} disabled={!startEnabled}>
          {autoMode && running ? '⏹️ Stop Auto Mode' : autoMode ? 'Start Auto Mode' : 'Start / Next'}
        </button>
        <button onClick={handleRepeat} disabled={!repeatEnabled}>
          Repeat
        </button>
        <button onClick={() => setSettingsVisible(!settingsVisible)} title="Settings">
          ⚙️
        </button>
      </div>

      <div className={`panel ${settingsVisible ? '' : 'hidden'}`} aria-label="Settings">
        <div className="row" style={{marginTop: 0, alignItems: 'center', gap: '14px'}}>
          <label>
            <input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} /> 
            Resolve to C
          </label>
          <label>
            <input type="checkbox" checked={notation === 'solfege'} onChange={(e) => {
              const newNotation = e.target.checked ? 'solfege' : 'letter'
              setNotation(newNotation)
              try { localStorage.setItem('fet-notation', newNotation) } catch {}
            }} /> 
            Solfege labels (Do Re)
          </label>
          <label>
            <input type="checkbox" checked={darkTheme} onChange={(e) => setDarkTheme(e.target.checked)} /> 
            Dark theme
          </label>
          <label>
            <input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} /> 
            Auto mode (passive practice)
          </label>
          <label>Exercise:
            <select value={exercise} onChange={(e) => setExercise(Number(e.target.value))}>
              <option value="1">Ex 1 – C to F</option>
              <option value="2">Ex 2 – G to C (next)</option>
              <option value="3">Ex 3 – Full octave (C–C)</option>
            </select>
          </label>
        </div>
        
        {autoMode && (
          <div className="panel" style={{marginTop: '8px', padding: '8px'}}>
            <div style={{fontWeight: 600, marginBottom: '6px'}}>Auto Mode Settings</div>
            <div className="row" style={{margin: 0, gap: '14px', alignItems: 'center'}}>
              <label>Interval:
                <select value={autoInterval} onChange={(e) => {
                  const interval = Number(e.target.value)
                  setAutoInterval(interval)
                  try { localStorage.setItem('fet-auto-interval', interval) } catch {}
                }}>
                  <option value="3000">3 seconds</option>
                  <option value="5000">5 seconds</option>
                  <option value="8000">8 seconds</option>
                  <option value="10000">10 seconds</option>
                  <option value="15000">15 seconds</option>
                </select>
              </label>
              <label>
                <input type="checkbox" checked={showAnswer} onChange={(e) => {
                  setShowAnswer(e.target.checked)
                  try { localStorage.setItem('fet-show-answer', e.target.checked) } catch {}
                }} /> 
                Show answer
              </label>
              <label>
                <input type="checkbox" checked={sayAnswer} onChange={(e) => {
                  setSayAnswer(e.target.checked)
                  try { localStorage.setItem('fet-say-answer', e.target.checked) } catch {}
                }} /> 
                Say answer (if available)
              </label>
            </div>
          </div>
        )}
      </div>

      <div 
        ref={pianoRef}
        className={`piano ${!answersEnabled ? 'disabled' : ''}`}
        onClick={onPianoClick}
        aria-label="Piano C4–C5"
      >
        {buildPianoKeys()}
      </div>

      <div className={`feedback ${feedbackOk === true ? 'ok' : feedbackOk === false ? 'err' : ''}`}>
        {feedback}
      </div>
      
      <div className="stat">
        Attempts: {attempts} | Correct: {correct} | Accuracy: {accuracy}%
      </div>
    </div>
  )
}

export default App
