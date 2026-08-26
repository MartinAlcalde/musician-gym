import { useEffect, useRef } from 'react'
import { EXERCISES } from '../utils/constants.js'

const EXERCISE_INFO = {
  1: {
    title: 'Exercise 1',
    subtitle: 'C to F',
    description: 'Do - Re - Mi - Fa',
    notes: 'First half octave'
  },
  2: {
    title: 'Exercise 2', 
    subtitle: 'G to C',
    description: 'Sol - La - Si - Do',
    notes: 'Second half octave'
  },
  3: {
    title: 'Exercise 3',
    subtitle: 'Full Octave',
    description: 'Do - Re - Mi - Fa - Sol - La - Si - Do',
    notes: 'Complete octave'
  }
}

export function ExerciseSelector({ 
  isVisible, 
  currentExercise, 
  onExerciseSelect,
  onClose 
}) {
  const modalRef = useRef(null)
  const selectedCardRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isVisible) return undefined

    const previouslyFocused = document.activeElement
    const focusFrame = requestAnimationFrame(() => {
      const firstCard = modalRef.current?.querySelector('.exercise-card')
      if (selectedCardRef.current) selectedCardRef.current.focus()
      else firstCard?.focus()
    })

    const handleModalKeyDown = (event) => {
      if (modalRef.current?.contains(event.target) || event.key === 'Escape') {
        event.stopPropagation()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !modalRef.current) return

      const focusableElements = Array.from(modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      if (!focusableElements.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleModalKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleModalKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      className="exercise-selector-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="exercise-selector-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-selector-title"
        aria-describedby="exercise-selector-help"
      >
        <div className="exercise-selector-header">
          <h2 id="exercise-selector-title">Select Exercise</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close exercise selector">×</button>
        </div>
        
        <div className="exercise-grid">
          {Object.entries(EXERCISE_INFO).map(([exerciseNum, info]) => {
            const isSelected = currentExercise === Number(exerciseNum)
            const exerciseNotes = EXERCISES[exerciseNum]
            
            return (
              <button
                type="button"
                key={exerciseNum}
                ref={isSelected ? selectedCardRef : null}
                className={`exercise-card ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
                aria-describedby={`exercise-${exerciseNum}-description exercise-${exerciseNum}-range`}
                onClick={() => {
                  onExerciseSelect(Number(exerciseNum))
                  onClose()
                }}
              >
                <span className="exercise-card-header">
                  <span className="exercise-card-title">{info.title}</span>
                  <span className="exercise-subtitle">{info.subtitle}</span>
                </span>
                
                <span className="exercise-description" id={`exercise-${exerciseNum}-description`}>
                  <span className="solfege-notes">{info.description}</span>
                  <span className="exercise-notes">{info.notes}</span>
                </span>
                
                <span className="exercise-range" id={`exercise-${exerciseNum}-range`}>
                  <span className="note-count">{exerciseNotes?.length || 0} notes</span>
                  {isSelected && (
                    <span className="current-indicator">Current</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        
        <div className="exercise-selector-footer">
          <p className="help-text" id="exercise-selector-help">
            Choose an exercise to practice specific note ranges within the C major scale.
          </p>
        </div>
      </div>
    </div>
  )
}
