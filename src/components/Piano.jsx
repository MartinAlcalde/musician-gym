import { useEffect, useRef, forwardRef } from 'react'
import { labelForMidi, hasSharpAfter, getWhiteKeys, midiToNoteName } from '../utils/helpers.js'

export const Piano = forwardRef(function Piano({ 
  exerciseSet, 
  tonicMidi = 60,
  scaleType = 'major',
  notation, 
  disabled, 
  onKeyClick,
  className = ''
}, ref) {
  const pianoRef = useRef(null)

  // Position black keys after render
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
        const left = (wRect.left - pianoRect.left) + whiteEl.offsetWidth - (black.offsetWidth / 2) + (gap / 2)
        black.style.left = `${left}px`
      })
    }

    // Use timeout to ensure DOM is fully rendered
    const timer = setTimeout(positionBlackKeys, 0)
    window.addEventListener('resize', positionBlackKeys)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', positionBlackKeys)
    }
  }, [exerciseSet, notation, tonicMidi, scaleType])

  const buildPianoKeys = () => {
    const whites = getWhiteKeys(tonicMidi)
    const allowedSet = new Set(exerciseSet)
    const useSolfege = notation === 'solfege'
    const tonicPc = tonicMidi % 12
    
    const keys = []
    
    // White keys
    whites.forEach((midi) => {
      const text = labelForMidi(midi, useSolfege ? 'solfege' : 'letter', tonicPc, scaleType)
      const inScope = allowedSet.has(midi)
      const noteName = midiToNoteName(midi)
      const visibleText = inScope ? text : ''
      
      keys.push(
        <button
          type="button"
          key={midi}
          className={`key white ${inScope ? 'in-scope' : 'out-of-scope'}`}
          data-midi={midi}
          data-note={noteName}
          disabled={disabled}
          aria-label={`${text}, ${noteName}${inScope ? ', in current exercise' : ', outside current exercise'}`}
        >
          <span className="label" aria-hidden="true">{visibleText}</span>
        </button>
      )
    })
    
    // Black keys
    whites.forEach((midi) => {
      const blackMidi = midi + 1
      if (hasSharpAfter(midi) && blackMidi >= tonicMidi && blackMidi <= tonicMidi + 12) {
        const text = labelForMidi(blackMidi, useSolfege ? 'solfege' : 'letter', tonicPc, scaleType)
        const inScope = allowedSet.has(blackMidi)
        const noteName = midiToNoteName(blackMidi)
        const visibleText = inScope ? text : ''
        
        keys.push(
          <button
            type="button"
            key={blackMidi}
            className={`key black ${inScope ? 'in-scope' : 'out-of-scope'}`}
            data-midi={blackMidi}
            data-note={noteName}
            data-black-for={midi}
            disabled={disabled}
            aria-label={`${text}, ${noteName}${inScope ? ', in current exercise' : ', outside current exercise'}`}
          >
            <span className="label" aria-hidden="true">{visibleText}</span>
          </button>
        )
      }
    })
    
    return keys
  }

  const handleClick = (e) => {
    const keyEl = e.target.closest('[data-midi]')
    if (!keyEl || disabled) return
    
    const midi = Number(keyEl.dataset.midi)
    onKeyClick?.(midi, keyEl)
  }

  // Helper functions are now imported directly in App.jsx

  return (
    <div 
      ref={(el) => {
        pianoRef.current = el
        if (ref) {
          if (typeof ref === 'function') ref(el)
          else ref.current = el
        }
      }}
      className={`piano ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
      role="group"
      aria-label={`Piano ${midiToNoteName(tonicMidi)}–${midiToNoteName(tonicMidi + 12)}`}
      aria-disabled={disabled}
    >
      {buildPianoKeys()}
    </div>
  )
})
