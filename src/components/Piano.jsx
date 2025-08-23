import { useEffect, useRef, forwardRef } from 'react'
import { MIDI_TO_NAME } from '../utils/constants.js'
import { labelForMidi, hasSharpAfter, getWhiteKeys, flashKey } from '../utils/helpers.js'

export const Piano = forwardRef(function Piano({ 
  exerciseSet, 
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
  }, [exerciseSet, notation])

  const buildPianoKeys = () => {
    const whites = getWhiteKeys()
    const allowedSet = new Set(exerciseSet)
    const useSolfege = notation === 'solfege'
    
    const keys = []
    
    // White keys
    whites.forEach((midi) => {
      const pc = midi % 12
      const text = useSolfege ? labelForMidi(midi, 'solfege') : labelForMidi(midi, 'letter')
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
    
    // Black keys
    whites.forEach((midi) => {
      if (hasSharpAfter(midi) && midi !== 72) { // 72 = C5
        const blackMidi = midi + 1
        const text = useSolfege ? labelForMidi(blackMidi, 'solfege') : labelForMidi(blackMidi, 'letter')
        
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
      aria-label="Piano C4–C5"
    >
      {buildPianoKeys()}
    </div>
  )
})