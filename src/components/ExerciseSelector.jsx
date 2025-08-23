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
  if (!isVisible) return null

  return (
    <div className="exercise-selector-overlay">
      <div className="exercise-selector-modal">
        <div className="exercise-selector-header">
          <h2>Select Exercise</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="exercise-grid">
          {Object.entries(EXERCISE_INFO).map(([exerciseNum, info]) => {
            const isSelected = currentExercise === Number(exerciseNum)
            const exerciseNotes = EXERCISES[exerciseNum]
            
            return (
              <div
                key={exerciseNum}
                className={`exercise-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onExerciseSelect(Number(exerciseNum))
                  onClose()
                }}
              >
                <div className="exercise-card-header">
                  <h3>{info.title}</h3>
                  <span className="exercise-subtitle">{info.subtitle}</span>
                </div>
                
                <div className="exercise-description">
                  <p className="solfege-notes">{info.description}</p>
                  <p className="exercise-notes">{info.notes}</p>
                </div>
                
                <div className="exercise-range">
                  <span className="note-count">{exerciseNotes?.length || 0} notes</span>
                  {isSelected && (
                    <span className="current-indicator">Current</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="exercise-selector-footer">
          <p className="help-text">
            Choose an exercise to practice specific note ranges within the C major scale.
          </p>
        </div>
      </div>
    </div>
  )
}